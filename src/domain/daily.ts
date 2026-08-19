import { generateOriginalConfiguration, generateReframeConfiguration } from "./generator";
import {
  buildReflectionInput,
  localReflectionProvider,
  type ReflectionProvider,
} from "./reflection";
import type {
  DailyCheckIn,
  DailyEntry,
  DailyVersion,
  PatternVariant,
  Profile,
  RecentSummary,
} from "./types";

export interface CreateDailyEntryOptions {
  recentSummaries?: readonly RecentSummary[];
  provider?: ReflectionProvider;
  now?: string;
  isSample?: boolean;
  sampleLabel?: string;
}

export function createDailyEntry(
  profile: Profile,
  checkIn: DailyCheckIn,
  date: string,
  options: CreateDailyEntryOptions = {},
): DailyEntry {
  const provider = options.provider ?? localReflectionProvider;
  const configuration = generateOriginalConfiguration(profile, checkIn, date);
  const reflection = provider.reflect(
    buildReflectionInput(profile, checkIn, configuration, options.recentSummaries),
  );
  const timestamp = options.now ?? new Date().toISOString();

  return {
    date,
    profileId: profile.id,
    profileSnapshot: {
      ...profile,
      ...(profile.lenses ? { lenses: { ...profile.lenses } } : {}),
    },
    checkIn: { ...checkIn },
    original: { configuration, reflection },
    activeVariant: "original",
    reframeUsed: false,
    isSample: options.isSample ?? false,
    ...(options.sampleLabel ? { sampleLabel: options.sampleLabel } : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export type ReframeResult =
  | { ok: true; entry: DailyEntry }
  | { ok: false; reason: "already-used" | "profile-mismatch"; entry: DailyEntry };

export function reframeDailyEntry(
  entry: DailyEntry,
  profile: Profile,
  recentSummaries: readonly RecentSummary[] = [],
  provider: ReflectionProvider = localReflectionProvider,
  now: string = new Date().toISOString(),
): ReframeResult {
  if (entry.reframeUsed || entry.reframe) {
    return { ok: false, reason: "already-used", entry };
  }
  const originalProfile = entry.profileSnapshot ?? profile;
  if (
    entry.profileId !== originalProfile.id ||
    entry.original.configuration.pathNumber !== originalProfile.pathNumber
  ) {
    return { ok: false, reason: "profile-mismatch", entry };
  }
  const configuration = generateReframeConfiguration(
    entry.original.configuration,
    originalProfile,
    entry.checkIn,
  );
  const reflection = provider.reflect(
    buildReflectionInput(originalProfile, entry.checkIn, configuration, recentSummaries),
  );
  return {
    ok: true,
    entry: {
      ...entry,
      reframe: { configuration, reflection },
      reframeUsed: true,
      activeVariant: "reframe",
      updatedAt: now,
    },
  };
}

export function getVersion(entry: DailyEntry, variant: PatternVariant): DailyVersion {
  if (variant === "reframe" && entry.reframe) return entry.reframe;
  return entry.original;
}

export function getActiveVersion(entry: DailyEntry): DailyVersion {
  return getVersion(entry, entry.activeVariant);
}

export function setActiveVariant(entry: DailyEntry, variant: PatternVariant): DailyEntry {
  if (variant === "reframe" && !entry.reframe) return entry;
  return { ...entry, activeVariant: variant };
}

export function toRecentSummary(
  entry: DailyEntry,
  variant: PatternVariant = entry.activeVariant,
): RecentSummary {
  const version = getVersion(entry, variant);
  const configuration = version.configuration;
  return {
    date: entry.date,
    dailyNumber: configuration.dailyNumber,
    primaryColor: configuration.primaryColor,
    form: configuration.form,
    direction: configuration.direction,
    scores: { ...configuration.scores },
    theme: version.reflection.theme,
  };
}
