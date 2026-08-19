import { applyGrowthEvent, createLivingLandscape } from "./growth";
import {
  migrateV1ToV2,
  type V1MigrationSource,
  type V2MigrationMarker,
} from "./migration";
import { isLocalDateKey } from "./prng";
import { isReflectionOutput } from "./reflection";
import {
  DEFAULT_REST_SESSION_PROGRESS,
  isRestSessionProgress,
  type RestSessionProgress,
} from "./restSession";
import {
  isDailyCheckIn,
  isDailyEntry,
  isPatternConfiguration,
  isProfile,
  type StorageDiagnostic,
  type StorageLike,
  type StorageWriteResult,
} from "./storage";
import {
  CARE_ACTIONS,
  PATH_NUMBERS,
  TIMES_OF_DAY,
  type DailyCheckIn,
  type DailyEntry,
  type FeedbackChoice,
  type FeedbackRecord,
  type GrowthEvent,
  type LandscapeLocale,
  type LivingLandscape,
  type Profile,
  type SampleWeekState,
  type WeatherState,
} from "./types";

export const NINEFOLD_V2_STORAGE_PREFIX = "ninefold:v2:";
export const NINEFOLD_V1_STORAGE_PREFIX = "ninefold:v1:";
export const V2_STORAGE_SCHEMA_VERSION = 2 as const;

export const V2_STORAGE_KEYS = {
  profile: `${NINEFOLD_V2_STORAGE_PREFIX}profile`,
  checkIns: `${NINEFOLD_V2_STORAGE_PREFIX}check-ins`,
  entries: `${NINEFOLD_V2_STORAGE_PREFIX}entries`,
  feedback: `${NINEFOLD_V2_STORAGE_PREFIX}feedback`,
  sampleWeek: `${NINEFOLD_V2_STORAGE_PREFIX}sample-week`,
  landscape: `${NINEFOLD_V2_STORAGE_PREFIX}landscape`,
  restSession: `${NINEFOLD_V2_STORAGE_PREFIX}rest-session`,
  migration: `${NINEFOLD_V2_STORAGE_PREFIX}migration`,
} as const;

const V1_STORAGE_KEYS = {
  profile: `${NINEFOLD_V1_STORAGE_PREFIX}profile`,
  checkIns: `${NINEFOLD_V1_STORAGE_PREFIX}check-ins`,
  entries: `${NINEFOLD_V1_STORAGE_PREFIX}entries`,
  feedback: `${NINEFOLD_V1_STORAGE_PREFIX}feedback`,
  sampleWeek: `${NINEFOLD_V1_STORAGE_PREFIX}sample-week`,
} as const;

interface V2Envelope<T> {
  schemaVersion: typeof V2_STORAGE_SCHEMA_VERSION;
  savedAt: string;
  data: T;
}

type Validator<T> = (value: unknown) => value is T;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const oneOf = <T extends string | number>(value: unknown, values: readonly T[]): value is T =>
  values.some((item) => item === value);

const isFiniteUnit = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

function isWeatherState(value: unknown): value is WeatherState {
  if (!isRecord(value)) return false;
  return (
    isFiniteUnit(value.skyClarity) &&
    isFiniteUnit(value.cloudDensity) &&
    isFiniteUnit(value.rainIntensity) &&
    isFiniteUnit(value.windStrength) &&
    isFiniteUnit(value.sunlight) &&
    isFiniteUnit(value.starVisibility) &&
    oneOf(value.timeOfDay, TIMES_OF_DAY) &&
    oneOf(value.motionBias, ["inward", "balanced", "outward"] as const) &&
    oneOf(value.focusMotif, ["work", "study", "relationships", "creativity", "self"] as const)
  );
}

function isGrowthEvent(value: unknown): value is GrowthEvent {
  if (!isRecord(value)) return false;
  const path = value.path;
  const pattern = value.pattern;
  const reframe = value.reframe;
  const activeVariant = value.activeVariant;
  return (
    typeof value.date === "string" &&
    isLocalDateKey(value.date) &&
    oneOf(path, PATH_NUMBERS) &&
    isDailyCheckIn(value.checkIn) &&
    oneOf(value.careAction, CARE_ACTIONS) &&
    (value.careActionSource === undefined ||
      oneOf(value.careActionSource, ["user", "migrated-default", "sample"] as const)) &&
    isWeatherState(value.weather) &&
    isPatternConfiguration(pattern) &&
    pattern.pathNumber === path &&
    pattern.date === value.date &&
    isReflectionOutput(value.reflection) &&
    (reframe === undefined || isPatternConfiguration(reframe)) &&
    (reframe === undefined || (reframe.pathNumber === path && reframe.date === value.date)) &&
    (value.reframeReflection === undefined || isReflectionOutput(value.reframeReflection)) &&
    (activeVariant === undefined || oneOf(activeVariant, ["original", "reframe"] as const)) &&
    (activeVariant !== "reframe" || isPatternConfiguration(reframe)) &&
    (value.localeAtCreation === undefined || oneOf(value.localeAtCreation, ["en", "zh-CN"] as const)) &&
    (value.isSample === undefined || typeof value.isSample === "boolean") &&
    (value.sampleLabel === undefined || typeof value.sampleLabel === "string") &&
    (value.feedback === undefined ||
      oneOf(value.feedback, ["useful", "too-generic", "too-negative", "did-not-match"] as const)) &&
    (value.createdAt === undefined || typeof value.createdAt === "string") &&
    (value.updatedAt === undefined || typeof value.updatedAt === "string")
  );
}

export function isLivingLandscape(value: unknown): value is LivingLandscape {
  if (!isRecord(value)) return false;
  return (
    value.version === 2 &&
    typeof value.profileId === "string" &&
    value.profileId.length > 0 &&
    oneOf(value.path, PATH_NUMBERS) &&
    Array.isArray(value.events) &&
    value.events.every(isGrowthEvent) &&
    typeof value.seasonIndex === "number" &&
    Number.isInteger(value.seasonIndex) &&
    value.seasonIndex >= 0 &&
    typeof value.lastVisitedAt === "string" &&
    oneOf(value.currentLocale, ["en", "zh-CN"] as const) &&
    (value.sampleWeek === undefined || isSampleWeekState(value.sampleWeek))
  );
}

const isEntryArray: Validator<DailyEntry[]> = (value: unknown): value is DailyEntry[] =>
  Array.isArray(value) && value.every(isDailyEntry);

const isCheckInMap: Validator<Record<string, DailyCheckIn>> = (
  value: unknown,
): value is Record<string, DailyCheckIn> =>
  isRecord(value) &&
  Object.entries(value).every(([date, checkIn]) => isLocalDateKey(date) && isDailyCheckIn(checkIn));

const FEEDBACK_CHOICES: readonly FeedbackChoice[] = [
  "useful",
  "too-generic",
  "too-negative",
  "did-not-match",
];

function isFeedbackRecord(value: unknown): value is FeedbackRecord {
  return (
    isRecord(value) &&
    typeof value.date === "string" &&
    isLocalDateKey(value.date) &&
    oneOf(value.choice, FEEDBACK_CHOICES) &&
    typeof value.recordedAt === "string"
  );
}

const isFeedbackArray: Validator<FeedbackRecord[]> = (
  value: unknown,
): value is FeedbackRecord[] => Array.isArray(value) && value.every(isFeedbackRecord);

function isSampleWeekState(value: unknown): value is SampleWeekState {
  return (
    isRecord(value) &&
    typeof value.loaded === "boolean" &&
    Array.isArray(value.dates) &&
    value.dates.every((date) => typeof date === "string" && isLocalDateKey(date)) &&
    (value.loadedAt === undefined || typeof value.loadedAt === "string")
  );
}

function isMigrationMarker(value: unknown): value is V2MigrationMarker {
  return (
    isRecord(value) &&
    value.sourceVersion === 1 &&
    value.targetVersion === 2 &&
    typeof value.fingerprint === "string" &&
    typeof value.completedAt === "string" &&
    Array.isArray(value.migratedDates) &&
    value.migratedDates.every((date) => typeof date === "string" && isLocalDateKey(date))
  );
}

function defaultBrowserStorage(): StorageLike | undefined {
  try {
    return (globalThis as { localStorage?: StorageLike }).localStorage;
  } catch {
    return undefined;
  }
}

export interface NinefoldV2Storage {
  readProfile(): Profile | null;
  saveProfile(profile: Profile): StorageWriteResult;
  readCheckIns(): Record<string, DailyCheckIn>;
  saveCheckIn(date: string, checkIn: DailyCheckIn): StorageWriteResult;
  readEntries(): DailyEntry[];
  readEntry(date: string): DailyEntry | null;
  saveEntry(entry: DailyEntry): StorageWriteResult;
  readFeedback(): FeedbackRecord[];
  saveFeedback(record: FeedbackRecord): StorageWriteResult;
  readSampleWeekState(): SampleWeekState;
  saveSampleWeekState(state: SampleWeekState): StorageWriteResult;
  readLandscape(): LivingLandscape | null;
  saveLandscape(landscape: LivingLandscape): StorageWriteResult;
  readRestSessionProgress(): RestSessionProgress;
  saveRestSessionProgress(progress: RestSessionProgress): StorageWriteResult;
  saveGrowthEvent(
    profile: Profile,
    event: GrowthEvent,
    locale?: LandscapeLocale,
  ): StorageWriteResult;
  readMigrationMarker(): V2MigrationMarker | null;
  removeSampleData(): StorageWriteResult;
  clearAll(): StorageWriteResult;
  hasAnyData(): boolean;
  getDiagnostics(): readonly StorageDiagnostic[];
  isAvailable(): boolean;
}

export function createNinefoldV2Storage(
  storage: StorageLike | undefined = defaultBrowserStorage(),
): NinefoldV2Storage {
  const diagnostics: StorageDiagnostic[] = [];
  let migrationChecked = false;
  let unavailableReported = false;

  const report = (diagnostic: StorageDiagnostic): void => {
    diagnostics.push(diagnostic);
  };

  const unavailable = (key: string): void => {
    if (unavailableReported) return;
    unavailableReported = true;
    report({ key, kind: "unavailable", message: "Browser storage is unavailable." });
  };

  const removeKey = (key: string): StorageWriteResult => {
    if (!storage) {
      unavailable(key);
      return { ok: false, error: "Browser storage is unavailable." };
    }
    try {
      storage.removeItem(key);
      return { ok: true };
    } catch {
      const error = "Browser storage could not be updated.";
      report({ key, kind: "write-failed", message: error });
      return { ok: false, error };
    }
  };

  const readRawV2 = <T>(key: string, validator: Validator<T>, fallback: T): T => {
    if (!storage) {
      unavailable(key);
      return fallback;
    }
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch {
      report({ key, kind: "read-failed", message: "Stored data could not be read." });
      return fallback;
    }
    if (raw === null) return fallback;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed) || parsed.schemaVersion !== V2_STORAGE_SCHEMA_VERSION) {
        report({ key, kind: "outdated", message: "An unsupported V2 storage value was ignored." });
        removeKey(key);
        return fallback;
      }
      if (typeof parsed.savedAt !== "string" || !validator(parsed.data)) {
        report({ key, kind: "corrupt", message: "Invalid V2 data was safely ignored." });
        removeKey(key);
        return fallback;
      }
      return parsed.data;
    } catch {
      report({ key, kind: "corrupt", message: "Unreadable V2 data was safely ignored." });
      removeKey(key);
      return fallback;
    }
  };

  const write = <T>(key: string, data: T): StorageWriteResult => {
    if (!storage) {
      unavailable(key);
      return { ok: false, error: "Browser storage is unavailable." };
    }
    const envelope: V2Envelope<T> = {
      schemaVersion: V2_STORAGE_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      data,
    };
    try {
      storage.setItem(key, JSON.stringify(envelope));
      return { ok: true };
    } catch {
      const error = "Browser storage could not be updated.";
      report({ key, kind: "write-failed", message: error });
      return { ok: false, error };
    }
  };

  const readLegacyData = (key: string): unknown => {
    if (!storage) return undefined;
    try {
      const raw = storage.getItem(key);
      if (raw === null) return undefined;
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !("data" in parsed)) return undefined;
      return parsed.data;
    } catch {
      report({ key, kind: "corrupt", message: "A legacy value could not be migrated and was left untouched." });
      return undefined;
    }
  };

  const legacyExists = (): boolean => {
    if (!storage) return false;
    try {
      return Object.values(V1_STORAGE_KEYS).some((key) => storage.getItem(key) !== null);
    } catch {
      return false;
    }
  };

  const ensureMigrated = (): void => {
    if (migrationChecked) return;
    migrationChecked = true;
    if (!storage || !legacyExists()) return;
    const existingMarker = readRawV2(V2_STORAGE_KEYS.migration, isMigrationMarker, null);
    if (existingMarker) return;

    const source: V1MigrationSource = {
      profile: readLegacyData(V1_STORAGE_KEYS.profile),
      checkIns: readLegacyData(V1_STORAGE_KEYS.checkIns),
      entries: readLegacyData(V1_STORAGE_KEYS.entries),
      feedback: readLegacyData(V1_STORAGE_KEYS.feedback),
      sampleWeek: readLegacyData(V1_STORAGE_KEYS.sampleWeek),
    };
    const existingLandscape = readRawV2(V2_STORAGE_KEYS.landscape, isLivingLandscape, null);
    const migration = migrateV1ToV2(source, existingLandscape ?? undefined);

    const operations: StorageWriteResult[] = [];
    if (migration.profile) operations.push(write(V2_STORAGE_KEYS.profile, migration.profile));
    const legacyEntries = Array.isArray(source.entries)
      ? source.entries.filter(isDailyEntry)
      : [];
    if (legacyEntries.length > 0) operations.push(write(V2_STORAGE_KEYS.entries, legacyEntries));
    if (Object.keys(migration.preservedCheckIns).length > 0) {
      operations.push(write(V2_STORAGE_KEYS.checkIns, migration.preservedCheckIns));
    }
    if (migration.preservedFeedback.length > 0) {
      operations.push(write(V2_STORAGE_KEYS.feedback, migration.preservedFeedback));
    }
    if (migration.sampleWeek.loaded || migration.sampleWeek.dates.length > 0) {
      operations.push(write(V2_STORAGE_KEYS.sampleWeek, migration.sampleWeek));
    }
    if (migration.landscape) operations.push(write(V2_STORAGE_KEYS.landscape, migration.landscape));
    operations.push(write(V2_STORAGE_KEYS.migration, migration.marker));

    if (operations.some((operation) => !operation.ok)) {
      report({
        key: V2_STORAGE_KEYS.migration,
        kind: "write-failed",
        message: "Legacy data remains intact, but part of the V2 migration could not be saved.",
      });
    }
    migration.issues.forEach((issue) => report({
      key: V2_STORAGE_KEYS.migration,
      kind: issue.kind.startsWith("invalid") ? "corrupt" : "read-failed",
      message: issue.message,
    }));
  };

  const readProfile = (): Profile | null => {
    ensureMigrated();
    return readRawV2(V2_STORAGE_KEYS.profile, isProfile, null);
  };

  const readEntries = (): DailyEntry[] => {
    ensureMigrated();
    return readRawV2(V2_STORAGE_KEYS.entries, isEntryArray, [])
      .sort((left, right) => left.date.localeCompare(right.date));
  };

  const readLandscape = (): LivingLandscape | null => {
    ensureMigrated();
    return readRawV2(V2_STORAGE_KEYS.landscape, isLivingLandscape, null);
  };

  return {
    readProfile,
    saveProfile: (profile) =>
      isProfile(profile) ? write(V2_STORAGE_KEYS.profile, profile) : { ok: false, error: "Invalid profile." },
    readCheckIns: () => {
      ensureMigrated();
      return readRawV2(V2_STORAGE_KEYS.checkIns, isCheckInMap, {});
    },
    saveCheckIn: (date, checkIn) => {
      if (!isLocalDateKey(date) || !isDailyCheckIn(checkIn)) {
        return { ok: false, error: "Invalid daily check-in." };
      }
      ensureMigrated();
      return write(V2_STORAGE_KEYS.checkIns, {
        ...readRawV2(V2_STORAGE_KEYS.checkIns, isCheckInMap, {}),
        [date]: checkIn,
      });
    },
    readEntries,
    readEntry: (date) => readEntries().find((entry) => entry.date === date) ?? null,
    saveEntry: (entry) => {
      if (!isDailyEntry(entry)) return { ok: false, error: "Invalid daily entry." };
      const entries = readEntries().filter((existing) => existing.date !== entry.date);
      return write(
        V2_STORAGE_KEYS.entries,
        [...entries, entry].sort((left, right) => left.date.localeCompare(right.date)),
      );
    },
    readFeedback: () => {
      ensureMigrated();
      return readRawV2(V2_STORAGE_KEYS.feedback, isFeedbackArray, []);
    },
    saveFeedback: (record) => {
      if (!isFeedbackRecord(record)) return { ok: false, error: "Invalid feedback." };
      ensureMigrated();
      const feedback = readRawV2(V2_STORAGE_KEYS.feedback, isFeedbackArray, [])
        .filter((existing) => existing.date !== record.date);
      return write(V2_STORAGE_KEYS.feedback, [...feedback, record]);
    },
    readSampleWeekState: () => {
      ensureMigrated();
      return readRawV2(V2_STORAGE_KEYS.sampleWeek, isSampleWeekState, { loaded: false, dates: [] });
    },
    saveSampleWeekState: (state) =>
      isSampleWeekState(state)
        ? write(V2_STORAGE_KEYS.sampleWeek, state)
        : { ok: false, error: "Invalid sample-week state." },
    readLandscape,
    saveLandscape: (landscape) =>
      isLivingLandscape(landscape)
        ? write(V2_STORAGE_KEYS.landscape, landscape)
        : { ok: false, error: "Invalid living landscape." },
    readRestSessionProgress: () =>
      readRawV2(
        V2_STORAGE_KEYS.restSession,
        isRestSessionProgress,
        { ...DEFAULT_REST_SESSION_PROGRESS },
      ),
    saveRestSessionProgress: (progress) =>
      isRestSessionProgress(progress)
        ? write(V2_STORAGE_KEYS.restSession, progress)
        : { ok: false, error: "Invalid Rest-session progress." },
    saveGrowthEvent: (profile, event, locale = "en") => {
      if (!isProfile(profile) || !isGrowthEvent(event)) {
        return { ok: false, error: "Invalid growth event." };
      }
      const existing = readLandscape();
      const foundation = existing && existing.profileId === profile.id && existing.path === profile.pathNumber
        ? { ...existing, currentLocale: locale }
        : createLivingLandscape(profile, locale, event.updatedAt ?? event.createdAt ?? event.date);
      try {
        return write(V2_STORAGE_KEYS.landscape, applyGrowthEvent(foundation, event));
      } catch {
        return { ok: false, error: "The growth event could not be added to this landscape." };
      }
    },
    readMigrationMarker: () => {
      ensureMigrated();
      return readRawV2(V2_STORAGE_KEYS.migration, isMigrationMarker, null);
    },
    removeSampleData: () => {
      const entries = readEntries().filter((entry) => !entry.isSample);
      const landscape = readLandscape();
      const results: StorageWriteResult[] = [
        entries.length > 0
          ? write(V2_STORAGE_KEYS.entries, entries)
          : removeKey(V2_STORAGE_KEYS.entries),
        removeKey(V2_STORAGE_KEYS.sampleWeek),
      ];
      if (landscape) {
        results.push(write(V2_STORAGE_KEYS.landscape, {
          ...landscape,
          events: landscape.events.filter((event) => !event.isSample),
          sampleWeek: { loaded: false, dates: [] },
        }));
      }
      return results.find((result) => !result.ok) ?? { ok: true };
    },
    clearAll: () => {
      if (!storage) {
        unavailable(NINEFOLD_V2_STORAGE_PREFIX);
        return { ok: false, error: "Browser storage is unavailable." };
      }
      try {
        const keys: string[] = [];
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (
            key?.startsWith(NINEFOLD_V2_STORAGE_PREFIX) ||
            key?.startsWith(NINEFOLD_V1_STORAGE_PREFIX)
          ) {
            keys.push(key);
          }
        }
        keys.forEach((key) => storage.removeItem(key));
        return { ok: true };
      } catch {
        const error = "Ninefold data could not be cleared.";
        report({ key: NINEFOLD_V2_STORAGE_PREFIX, kind: "write-failed", message: error });
        return { ok: false, error };
      }
    },
    hasAnyData: () => {
      if (!storage) return false;
      try {
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (
            key?.startsWith(NINEFOLD_V2_STORAGE_PREFIX) ||
            key?.startsWith(NINEFOLD_V1_STORAGE_PREFIX)
          ) return true;
        }
        return false;
      } catch {
        report({
          key: NINEFOLD_V2_STORAGE_PREFIX,
          kind: "read-failed",
          message: "Stored data could not be inspected.",
        });
        return false;
      }
    },
    getDiagnostics: () => [...diagnostics],
    isAvailable: () => {
      if (!storage) return false;
      const probeKey = `${NINEFOLD_V2_STORAGE_PREFIX}__probe__`;
      try {
        storage.setItem(probeKey, "1");
        storage.removeItem(probeKey);
        return true;
      } catch {
        return false;
      }
    },
  };
}

export const ninefoldV2Storage = createNinefoldV2Storage();
