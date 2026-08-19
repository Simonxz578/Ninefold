import { isReflectionOutput } from "./reflection";
import { isLocalDateKey } from "./prng";
import { validatePatternRanges } from "./generator";
import {
  COLOR_NAMES,
  DIRECTIONS,
  FORM_NAMES,
  PATH_NUMBERS,
} from "./types";
import type {
  DailyCheckIn,
  DailyEntry,
  DailyVersion,
  FeedbackChoice,
  FeedbackRecord,
  PatternConfiguration,
  PreferenceLenses,
  Profile,
  SampleWeekState,
  ZodiacSign,
} from "./types";

export const NINEFOLD_STORAGE_PREFIX = "ninefold:v1:";
export const STORAGE_SCHEMA_VERSION = 1 as const;

export const STORAGE_KEYS = {
  profile: `${NINEFOLD_STORAGE_PREFIX}profile`,
  checkIns: `${NINEFOLD_STORAGE_PREFIX}check-ins`,
  entries: `${NINEFOLD_STORAGE_PREFIX}entries`,
  feedback: `${NINEFOLD_STORAGE_PREFIX}feedback`,
  sampleWeek: `${NINEFOLD_STORAGE_PREFIX}sample-week`,
} as const;

export interface StorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface StorageEnvelope<T> {
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  savedAt: string;
  data: T;
}

export interface StorageDiagnostic {
  key: string;
  kind: "unavailable" | "corrupt" | "outdated" | "write-failed" | "read-failed";
  message: string;
}

export interface StorageWriteResult {
  ok: boolean;
  error?: string;
}

const ZODIAC_SIGNS: readonly ZodiacSign[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

const FEEDBACK_CHOICES: readonly FeedbackChoice[] = [
  "useful",
  "too-generic",
  "too-negative",
  "did-not-match",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const oneOf = <T extends string | number>(value: unknown, values: readonly T[]): value is T =>
  values.some((item) => item === value);

const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === "string";

function isLenses(value: unknown): value is PreferenceLenses {
  if (!isRecord(value)) return false;
  return (
    oneOf(value.orientation, ["internal", "neutral", "external"] as const) ||
    value.orientation === undefined
  ) &&
    (oneOf(value.approach, ["structured", "neutral", "exploratory"] as const) ||
      value.approach === undefined) &&
    (oneOf(value.processing, ["analytical", "neutral", "intuitive"] as const) ||
      value.processing === undefined) &&
    (oneOf(value.pace, ["stable", "neutral", "adaptive"] as const) || value.pace === undefined);
}

export function isProfile(value: unknown): value is Profile {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    oneOf(value.pathNumber, PATH_NUMBERS) &&
    isOptionalString(value.displayName) &&
    (value.zodiacSign === undefined || oneOf(value.zodiacSign, ZODIAC_SIGNS)) &&
    (value.lenses === undefined || isLenses(value.lenses)) &&
    typeof value.createdAt === "string"
  );
}

export function isDailyCheckIn(value: unknown): value is DailyCheckIn {
  if (!isRecord(value)) return false;
  return (
    oneOf(value.energy, [1, 2, 3, 4, 5] as const) &&
    oneOf(value.clarity, [1, 2, 3, 4, 5] as const) &&
    oneOf(value.connection, ["inward", "balanced", "outward"] as const) &&
    oneOf(value.focus, ["work", "study", "relationships", "creativity", "self"] as const) &&
    isOptionalString(value.note) &&
    (typeof value.note !== "string" || value.note.length <= 280)
  );
}

export function isPatternConfiguration(value: unknown): value is PatternConfiguration {
  if (!isRecord(value) || !isRecord(value.opacityProfile) || !isRecord(value.scores)) return false;
  const candidate = value as unknown as PatternConfiguration;
  return (
    typeof value.generatorVersion === "string" &&
    typeof value.dictionaryVersion === "string" &&
    typeof value.seed === "string" &&
    typeof value.date === "string" &&
    isLocalDateKey(value.date) &&
    oneOf(value.variant, ["original", "reframe"] as const) &&
    oneOf(value.pathNumber, PATH_NUMBERS) &&
    oneOf(value.dailyNumber, PATH_NUMBERS) &&
    oneOf(value.primaryColor, COLOR_NAMES) &&
    oneOf(value.secondaryColor, COLOR_NAMES) &&
    oneOf(value.form, FORM_NAMES) &&
    oneOf(value.direction, DIRECTIONS) &&
    oneOf(value.symmetry, ["radial", "bilateral", "rotational", "asymmetric"] as const) &&
    typeof value.rotation === "number" &&
    typeof value.layerCount === "number" &&
    typeof value.density === "number" &&
    typeof value.lineWeight === "number" &&
    typeof value.opacityProfile.base === "number" &&
    typeof value.opacityProfile.accent === "number" &&
    typeof value.opacityProfile.line === "number" &&
    typeof value.scores.clarity === "number" &&
    typeof value.scores.momentum === "number" &&
    typeof value.scores.tension === "number" &&
    validatePatternRanges(candidate).valid
  );
}

function isDailyVersion(value: unknown): value is DailyVersion {
  return (
    isRecord(value) &&
    isPatternConfiguration(value.configuration) &&
    isReflectionOutput(value.reflection)
  );
}

function sameScores(left: DailyVersion, right: DailyVersion): boolean {
  return (
    left.configuration.scores.clarity === right.configuration.scores.clarity &&
    left.configuration.scores.momentum === right.configuration.scores.momentum &&
    left.configuration.scores.tension === right.configuration.scores.tension
  );
}

export function isDailyEntry(value: unknown): value is DailyEntry {
  if (!isRecord(value)) return false;
  const original = value.original;
  const profileSnapshot = value.profileSnapshot;
  const hasValidReframe = value.reframe === undefined || isDailyVersion(value.reframe);
  const activeVariantValid =
    value.activeVariant === "original" ||
    (value.activeVariant === "reframe" && isDailyVersion(value.reframe));
  const coreValid = (
    typeof value.date === "string" &&
    isLocalDateKey(value.date) &&
    typeof value.profileId === "string" &&
    value.profileId.length > 0 &&
    (profileSnapshot === undefined || isProfile(profileSnapshot)) &&
    isDailyCheckIn(value.checkIn) &&
    isDailyVersion(original) &&
    original.configuration.variant === "original" &&
    original.configuration.date === value.date &&
    hasValidReframe &&
    activeVariantValid &&
    typeof value.reframeUsed === "boolean" &&
    (!value.reframeUsed || isDailyVersion(value.reframe)) &&
    typeof value.isSample === "boolean" &&
    isOptionalString(value.sampleLabel) &&
    (value.feedback === undefined || oneOf(value.feedback, FEEDBACK_CHOICES)) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
  if (!coreValid || !isDailyVersion(original)) return false;
  if (
    isProfile(profileSnapshot) &&
    (profileSnapshot.id !== value.profileId ||
      profileSnapshot.pathNumber !== original.configuration.pathNumber)
  ) {
    return false;
  }
  if (isDailyVersion(value.reframe)) {
    return (
      value.reframe.configuration.variant === "reframe" &&
      value.reframe.configuration.date === value.date &&
      value.reframe.configuration.dailyNumber === original.configuration.dailyNumber &&
      value.reframe.configuration.pathNumber === original.configuration.pathNumber &&
      sameScores(original, value.reframe) &&
      value.reframeUsed === true
    );
  }
  return value.reframeUsed === false && value.activeVariant === "original";
}

function isFeedbackRecord(value: unknown): value is FeedbackRecord {
  return (
    isRecord(value) &&
    typeof value.date === "string" &&
    isLocalDateKey(value.date) &&
    oneOf(value.choice, FEEDBACK_CHOICES) &&
    typeof value.recordedAt === "string"
  );
}

function isSampleWeekState(value: unknown): value is SampleWeekState {
  return (
    isRecord(value) &&
    typeof value.loaded === "boolean" &&
    Array.isArray(value.dates) &&
    value.dates.every((date) => typeof date === "string" && isLocalDateKey(date)) &&
    isOptionalString(value.loadedAt)
  );
}

type Validator<T> = (value: unknown) => value is T;

const isCheckInMap: Validator<Record<string, DailyCheckIn>> = (
  value: unknown,
): value is Record<string, DailyCheckIn> =>
  isRecord(value) &&
  Object.entries(value).every(([date, checkIn]) => isLocalDateKey(date) && isDailyCheckIn(checkIn));

const isEntryArray: Validator<DailyEntry[]> = (value: unknown): value is DailyEntry[] =>
  Array.isArray(value) && value.every(isDailyEntry);

const isFeedbackArray: Validator<FeedbackRecord[]> = (
  value: unknown,
): value is FeedbackRecord[] => Array.isArray(value) && value.every(isFeedbackRecord);

function defaultBrowserStorage(): StorageLike | undefined {
  try {
    return (globalThis as { localStorage?: StorageLike }).localStorage;
  } catch {
    return undefined;
  }
}

export interface NinefoldStorage {
  readProfile(): Profile | null;
  saveProfile(profile: Profile): StorageWriteResult;
  readCheckIns(): Record<string, DailyCheckIn>;
  saveCheckIn(date: string, checkIn: DailyCheckIn): StorageWriteResult;
  readEntries(): DailyEntry[];
  readEntry(date: string): DailyEntry | null;
  saveEntry(entry: DailyEntry): StorageWriteResult;
  removeEntry(date: string): StorageWriteResult;
  readFeedback(): FeedbackRecord[];
  saveFeedback(record: FeedbackRecord): StorageWriteResult;
  readSampleWeekState(): SampleWeekState;
  saveSampleWeekState(state: SampleWeekState): StorageWriteResult;
  removeSampleData(): StorageWriteResult;
  clearAll(): StorageWriteResult;
  hasAnyData(): boolean;
  getDiagnostics(): readonly StorageDiagnostic[];
  isAvailable(): boolean;
}

export function createNinefoldStorage(storage: StorageLike | undefined = defaultBrowserStorage()): NinefoldStorage {
  const diagnostics: StorageDiagnostic[] = [];
  let unavailableReported = false;

  const report = (diagnostic: StorageDiagnostic): void => {
    diagnostics.push(diagnostic);
  };

  const unavailable = (key: string): void => {
    if (unavailableReported) return;
    unavailableReported = true;
    report({ key, kind: "unavailable", message: "Browser storage is unavailable." });
  };

  const removeCorruptKey = (key: string): void => {
    try {
      storage?.removeItem(key);
    } catch {
      // A read still returns its safe fallback when storage cannot be repaired.
    }
  };

  const read = <T>(key: string, validator: Validator<T>, fallback: T): T => {
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
      if (!isRecord(parsed) || parsed.schemaVersion !== STORAGE_SCHEMA_VERSION) {
        report({ key, kind: "outdated", message: "An unsupported storage version was ignored." });
        removeCorruptKey(key);
        return fallback;
      }
      if (typeof parsed.savedAt !== "string" || !validator(parsed.data)) {
        report({ key, kind: "corrupt", message: "Invalid stored data was safely ignored." });
        removeCorruptKey(key);
        return fallback;
      }
      return parsed.data;
    } catch {
      report({ key, kind: "corrupt", message: "Unreadable stored data was safely ignored." });
      removeCorruptKey(key);
      return fallback;
    }
  };

  const write = <T>(key: string, data: T): StorageWriteResult => {
    if (!storage) {
      unavailable(key);
      return { ok: false, error: "Browser storage is unavailable." };
    }
    const envelope: StorageEnvelope<T> = {
      schemaVersion: STORAGE_SCHEMA_VERSION,
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

  const remove = (key: string): StorageWriteResult => {
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

  return {
    readProfile: () => read(STORAGE_KEYS.profile, isProfile, null),
    saveProfile: (profile) => {
      if (!isProfile(profile)) return { ok: false, error: "Invalid profile." };
      return write(STORAGE_KEYS.profile, profile);
    },
    readCheckIns: () => read(STORAGE_KEYS.checkIns, isCheckInMap, {}),
    saveCheckIn: (date, checkIn) => {
      if (!isLocalDateKey(date) || !isDailyCheckIn(checkIn)) {
        return { ok: false, error: "Invalid daily check-in." };
      }
      return write(STORAGE_KEYS.checkIns, {
        ...read(STORAGE_KEYS.checkIns, isCheckInMap, {}),
        [date]: checkIn,
      });
    },
    readEntries: () =>
      read(STORAGE_KEYS.entries, isEntryArray, []).sort((left, right) =>
        left.date.localeCompare(right.date),
      ),
    readEntry: (date) =>
      read(STORAGE_KEYS.entries, isEntryArray, []).find((entry) => entry.date === date) ?? null,
    saveEntry: (entry) => {
      if (!isDailyEntry(entry)) return { ok: false, error: "Invalid daily entry." };
      const entries = read(STORAGE_KEYS.entries, isEntryArray, []).filter(
        (existing) => existing.date !== entry.date,
      );
      return write(
        STORAGE_KEYS.entries,
        [...entries, entry].sort((left, right) => left.date.localeCompare(right.date)),
      );
    },
    removeEntry: (date) =>
      isLocalDateKey(date)
        ? write(
            STORAGE_KEYS.entries,
            read(STORAGE_KEYS.entries, isEntryArray, []).filter((entry) => entry.date !== date),
          )
        : { ok: false, error: "Invalid date." },
    readFeedback: () => read(STORAGE_KEYS.feedback, isFeedbackArray, []),
    saveFeedback: (record) => {
      if (!isFeedbackRecord(record)) return { ok: false, error: "Invalid feedback." };
      const feedback = read(STORAGE_KEYS.feedback, isFeedbackArray, []).filter(
        (existing) => existing.date !== record.date,
      );
      return write(STORAGE_KEYS.feedback, [...feedback, record]);
    },
    readSampleWeekState: () =>
      read(STORAGE_KEYS.sampleWeek, isSampleWeekState, { loaded: false, dates: [] }),
    saveSampleWeekState: (state) =>
      isSampleWeekState(state)
        ? write(STORAGE_KEYS.sampleWeek, state)
        : { ok: false, error: "Invalid sample-week state." },
    removeSampleData: () => {
      const remaining = read(STORAGE_KEYS.entries, isEntryArray, []).filter(
        (entry) => !entry.isSample,
      );
      const result = remaining.length > 0
        ? write(STORAGE_KEYS.entries, remaining)
        : remove(STORAGE_KEYS.entries);
      if (!result.ok) return result;
      return remove(STORAGE_KEYS.sampleWeek);
    },
    clearAll: () => {
      if (!storage) {
        unavailable(NINEFOLD_STORAGE_PREFIX);
        return { ok: false, error: "Browser storage is unavailable." };
      }
      try {
        const keys: string[] = [];
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (key?.startsWith(NINEFOLD_STORAGE_PREFIX)) keys.push(key);
        }
        keys.forEach((key) => storage.removeItem(key));
        return { ok: true };
      } catch {
        const error = "Ninefold data could not be cleared.";
        report({ key: NINEFOLD_STORAGE_PREFIX, kind: "write-failed", message: error });
        return { ok: false, error };
      }
    },
    hasAnyData: () => {
      if (!storage) return false;
      try {
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (key?.startsWith(NINEFOLD_STORAGE_PREFIX)) return true;
        }
        return false;
      } catch {
        report({
          key: NINEFOLD_STORAGE_PREFIX,
          kind: "read-failed",
          message: "Stored data could not be inspected.",
        });
        return false;
      }
    },
    getDiagnostics: () => [...diagnostics],
    isAvailable: () => {
      if (!storage) return false;
      const probeKey = `${NINEFOLD_STORAGE_PREFIX}__probe__`;
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

export const ninefoldStorage = createNinefoldStorage();
