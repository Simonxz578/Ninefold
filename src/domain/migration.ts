import { cloneGrowthEvent, createGrowthEventFromDailyEntry } from "./growth";
import { getSeasonIndex } from "./seasons";
import { hashSeed, isLocalDateKey } from "./prng";
import { isDailyCheckIn, isDailyEntry, isProfile } from "./storage";
import type {
  DailyCheckIn,
  DailyEntry,
  FeedbackChoice,
  FeedbackRecord,
  GrowthEvent,
  LandscapeLocale,
  LivingLandscape,
  Profile,
  SampleWeekState,
} from "./types";

export interface V1MigrationSource {
  profile?: unknown;
  checkIns?: unknown;
  entries?: unknown;
  feedback?: unknown;
  sampleWeek?: unknown;
  locale?: unknown;
  migratedAt?: unknown;
}

export type MigrationIssueKind =
  | "invalid-source"
  | "invalid-profile"
  | "invalid-check-in"
  | "invalid-entry"
  | "invalid-feedback"
  | "invalid-sample-week"
  | "profile-recovered"
  | "existing-landscape-mismatch";

export interface MigrationIssue {
  kind: MigrationIssueKind;
  message: string;
  index?: number;
}

export interface V2MigrationMarker {
  sourceVersion: 1;
  targetVersion: 2;
  fingerprint: string;
  completedAt: string;
  migratedDates: string[];
}

export interface V1ToV2MigrationResult {
  profile: Profile | null;
  landscape: LivingLandscape | null;
  preservedCheckIns: Record<string, DailyCheckIn>;
  preservedFeedback: FeedbackRecord[];
  sampleWeek: SampleWeekState;
  marker: V2MigrationMarker;
  issues: MigrationIssue[];
  skippedEntryCount: number;
}

const FEEDBACK_CHOICES: readonly FeedbackChoice[] = [
  "useful",
  "too-generic",
  "too-negative",
  "did-not-match",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const cloneProfile = (profile: Profile): Profile => ({
  ...profile,
  ...(profile.lenses ? { lenses: { ...profile.lenses } } : {}),
});

function isFeedbackRecord(value: unknown): value is FeedbackRecord {
  return (
    isRecord(value) &&
    typeof value.date === "string" &&
    isLocalDateKey(value.date) &&
    FEEDBACK_CHOICES.includes(value.choice as FeedbackChoice) &&
    typeof value.recordedAt === "string"
  );
}

function isSampleWeekState(value: unknown): value is SampleWeekState {
  return (
    isRecord(value) &&
    typeof value.loaded === "boolean" &&
    Array.isArray(value.dates) &&
    value.dates.every((date) => typeof date === "string" && isLocalDateKey(date)) &&
    (value.loadedAt === undefined || typeof value.loadedAt === "string")
  );
}

function parseCheckIns(
  value: unknown,
  issues: MigrationIssue[],
): Record<string, DailyCheckIn> {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    issues.push({ kind: "invalid-check-in", message: "The V1 check-in map was not an object." });
    return {};
  }

  const checkIns: Record<string, DailyCheckIn> = {};
  Object.entries(value).forEach(([date, checkIn]) => {
    if (isLocalDateKey(date) && isDailyCheckIn(checkIn)) {
      checkIns[date] = { ...checkIn };
    } else {
      issues.push({
        kind: "invalid-check-in",
        message: `The V1 check-in for ${date} was skipped safely.`,
      });
    }
  });
  return checkIns;
}

function parseEntries(value: unknown, issues: MigrationIssue[]): DailyEntry[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    issues.push({ kind: "invalid-entry", message: "The V1 entry collection was not an array." });
    return [];
  }

  return value.flatMap((entry, index) => {
    if (isDailyEntry(entry)) return [entry];
    issues.push({
      kind: "invalid-entry",
      message: "An invalid V1 daily entry was skipped safely.",
      index,
    });
    return [];
  });
}

function parseFeedback(value: unknown, issues: MigrationIssue[]): FeedbackRecord[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    issues.push({ kind: "invalid-feedback", message: "The V1 feedback collection was not an array." });
    return [];
  }

  return value.flatMap((record, index) => {
    if (isFeedbackRecord(record)) return [{ ...record }];
    issues.push({
      kind: "invalid-feedback",
      message: "An invalid V1 feedback record was skipped safely.",
      index,
    });
    return [];
  });
}

function recoverProfile(entries: readonly DailyEntry[], issues: MigrationIssue[]): Profile | null {
  const snapshot = entries.find((entry) => entry.profileSnapshot)?.profileSnapshot;
  if (snapshot) {
    issues.push({
      kind: "profile-recovered",
      message: "The V1 profile was recovered from a validated daily snapshot.",
    });
    return cloneProfile(snapshot);
  }
  const entry = entries[0];
  if (!entry) return null;
  issues.push({
    kind: "profile-recovered",
    message: "A minimal V1 profile was recovered from a validated daily entry.",
  });
  return {
    id: entry.profileId,
    pathNumber: entry.original.configuration.pathNumber,
    createdAt: entry.createdAt,
  };
}

function entryToGrowthEvent(
  entry: DailyEntry,
  feedbackByDate: ReadonlyMap<string, FeedbackChoice>,
  locale: LandscapeLocale,
): GrowthEvent {
  const event = createGrowthEventFromDailyEntry(entry, {
    // V1 had no care choice. Observe is deliberately neutral and transparently marked.
    careAction: "observe",
    careActionSource: entry.isSample ? "sample" : "migrated-default",
    localeAtCreation: locale,
    timeOfDay: "day",
  });
  const feedback = entry.feedback ?? feedbackByDate.get(entry.date);
  if (feedback) event.feedback = feedback;
  return event;
}

function migrationTimestamp(
  sourceTimestamp: unknown,
  profile: Profile | null,
  entries: readonly DailyEntry[],
): string {
  if (typeof sourceTimestamp === "string" && sourceTimestamp.length > 0) return sourceTimestamp;
  const timestamps = entries
    .flatMap((entry) => [entry.createdAt, entry.updatedAt])
    .filter((value) => value.length > 0)
    .sort();
  return timestamps.at(-1) ?? profile?.createdAt ?? "1970-01-01T00:00:00.000Z";
}

function migrationFingerprint(
  profile: Profile | null,
  events: readonly GrowthEvent[],
  feedback: readonly FeedbackRecord[],
  sampleWeek: SampleWeekState,
): string {
  const seed = JSON.stringify({
    profile: profile ? [profile.id, profile.pathNumber, profile.createdAt] : null,
    events: events.map((event) => [
      event.date,
      event.pattern.seed,
      event.reframe?.seed ?? null,
      event.feedback ?? null,
      event.isSample ?? false,
    ]),
    feedback: feedback.map((record) => [record.date, record.choice, record.recordedAt]),
    sampleWeek: [sampleWeek.loaded, sampleWeek.dates, sampleWeek.loadedAt ?? null],
  });
  return `v1-${hashSeed(seed).toString(16).padStart(8, "0")}`;
}

/**
 * Pure, non-destructive migration. Inputs are treated as untrusted decoded V1
 * values; invalid records are reported and skipped. Existing V2 dates win,
 * making retries safe and idempotent.
 */
export function migrateV1ToV2(
  source: V1MigrationSource | unknown,
  existingLandscape?: LivingLandscape,
): V1ToV2MigrationResult {
  const issues: MigrationIssue[] = [];
  const sourceRecord = isRecord(source) ? source : {};
  if (!isRecord(source)) {
    issues.push({ kind: "invalid-source", message: "The V1 migration source was invalid." });
  }

  const entries = parseEntries(sourceRecord.entries, issues);
  const sourceProfile = sourceRecord.profile;
  let profile: Profile | null;
  if (sourceProfile === undefined || sourceProfile === null) {
    profile = recoverProfile(entries, issues);
  } else if (isProfile(sourceProfile)) {
    profile = cloneProfile(sourceProfile);
  } else {
    issues.push({ kind: "invalid-profile", message: "The invalid V1 profile was ignored." });
    profile = recoverProfile(entries, issues);
  }

  const preservedCheckIns = parseCheckIns(sourceRecord.checkIns, issues);
  const preservedFeedback = parseFeedback(sourceRecord.feedback, issues);
  const feedbackByDate = new Map(
    preservedFeedback.map((record) => [record.date, record.choice] as const),
  );
  const locale: LandscapeLocale = sourceRecord.locale === "zh-CN" ? "zh-CN" : "en";
  const migratedEvents = entries.map((entry) => entryToGrowthEvent(entry, feedbackByDate, locale));

  let sampleWeek: SampleWeekState = { loaded: false, dates: [] };
  if (sourceRecord.sampleWeek !== undefined) {
    if (isSampleWeekState(sourceRecord.sampleWeek)) {
      sampleWeek = {
        ...sourceRecord.sampleWeek,
        dates: [...sourceRecord.sampleWeek.dates],
      };
    } else {
      issues.push({
        kind: "invalid-sample-week",
        message: "The invalid V1 sample-week state was ignored.",
      });
    }
  }

  let reusableLandscape = existingLandscape;
  if (
    reusableLandscape &&
    profile &&
    (reusableLandscape.profileId !== profile.id || reusableLandscape.path !== profile.pathNumber)
  ) {
    issues.push({
      kind: "existing-landscape-mismatch",
      message: "An unrelated existing V2 landscape was not merged with the V1 profile.",
    });
    reusableLandscape = undefined;
  }

  const eventByDate = new Map(migratedEvents.map((event) => [event.date, event] as const));
  reusableLandscape?.events.forEach((event) => eventByDate.set(event.date, cloneGrowthEvent(event)));
  const events = [...eventByDate.values()].sort((left, right) => left.date.localeCompare(right.date));
  const completedAt = migrationTimestamp(sourceRecord.migratedAt, profile, entries);
  const effectiveProfileId = reusableLandscape?.profileId ?? profile?.id ?? entries[0]?.profileId;
  const effectivePath =
    reusableLandscape?.path ?? profile?.pathNumber ?? entries[0]?.original.configuration.pathNumber;

  const landscape = effectiveProfileId && effectivePath
    ? {
        version: 2 as const,
        profileId: effectiveProfileId,
        path: effectivePath,
        events,
        seasonIndex: getSeasonIndex(events.length),
        lastVisitedAt: reusableLandscape?.lastVisitedAt ?? completedAt,
        currentLocale: reusableLandscape?.currentLocale ?? locale,
        sampleWeek: reusableLandscape?.sampleWeek
          ? {
              ...reusableLandscape.sampleWeek,
              dates: [...reusableLandscape.sampleWeek.dates],
            }
          : sampleWeek,
      }
    : null;

  return {
    profile,
    landscape,
    preservedCheckIns,
    preservedFeedback,
    sampleWeek,
    marker: {
      sourceVersion: 1,
      targetVersion: 2,
      fingerprint: migrationFingerprint(profile, migratedEvents, preservedFeedback, sampleWeek),
      completedAt,
      migratedDates: migratedEvents.map((event) => event.date),
    },
    issues,
    skippedEntryCount:
      Array.isArray(sourceRecord.entries) ? sourceRecord.entries.length - entries.length : 0,
  };
}
