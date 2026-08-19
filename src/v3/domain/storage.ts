import { isLocalDateKey } from "../../domain/prng";
import { PATH_NUMBERS } from "../../domain/types";
import { isPersonalityPreferences } from "./personality";
import {
  createDailyReadingSemantics,
  deriveDailyStateCell,
  isDailyReadingSemantics,
  isRatingNine,
} from "./reading";
import {
  AMBIENT_MODES,
  BUILDER_STAGES,
  CLOUD_ARCHETYPES,
  V3_LEAF_LAYOUT_VERSION,
  V3_SCHEMA_VERSION,
  ZODIAC_SIGNS,
  type CompletedSessionV3,
  type DailyCheckInV3,
  type DraftWorldIdentity,
  type MeditationProgressV3,
  type NinefoldV3State,
  type V3Locale,
  type V3Profile,
  type WorldStateV3,
} from "./types";
import { deriveZodiacSign, isValidBirthDate } from "./zodiac";

export const NINEFOLD_V3_STORAGE_PREFIX = "ninefold:v3:";

export const V3_STORAGE_KEYS = {
  state: `${NINEFOLD_V3_STORAGE_PREFIX}state`,
  draft: `${NINEFOLD_V3_STORAGE_PREFIX}builder-draft`,
  locale: `${NINEFOLD_V3_STORAGE_PREFIX}locale`,
} as const;

export interface V3StorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface V3StorageEnvelope<T> {
  schemaVersion: typeof V3_SCHEMA_VERSION;
  savedAt: string;
  data: T;
}

export interface V3StorageDiagnostic {
  key: string;
  kind: "unavailable" | "corrupt" | "outdated" | "write-failed" | "read-failed";
  message: string;
}

export interface V3StorageWriteResult {
  ok: boolean;
  error?: string;
}

type Validator<T> = (value: unknown) => value is T;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const isIsoInstant = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && Number.isFinite(Date.parse(value));

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isOptionalNickname = (value: unknown): value is string | undefined =>
  value === undefined
  || (typeof value === "string" && value === value.trim() && value.length > 0 && value.length <= 40);

const oneOf = <T extends string | number>(value: unknown, values: readonly T[]): value is T =>
  values.some((item) => item === value);

export function isV3Profile(value: unknown): value is V3Profile {
  if (!isRecord(value)) return false;
  const birthMonth = value.birthMonth;
  const birthDay = value.birthDay;
  if (typeof birthMonth !== "number" || typeof birthDay !== "number") return false;
  return value.version === V3_SCHEMA_VERSION
    && isNonEmptyString(value.id)
    && isNonEmptyString(value.stableSeed)
    && isOptionalNickname(value.nickname)
    && isValidBirthDate(birthMonth, birthDay)
    && oneOf(value.zodiacSign, ZODIAC_SIGNS)
    && value.zodiacSign === deriveZodiacSign(birthMonth, birthDay)
    && oneOf(value.cloudArchetype, CLOUD_ARCHETYPES)
    && oneOf(value.worldPrototype, PATH_NUMBERS)
    && isPersonalityPreferences(value.personality)
    && isIsoInstant(value.createdAt)
    && oneOf(value.preferredAmbientMode, AMBIENT_MODES);
}

export function isWorldStateV3(value: unknown): value is WorldStateV3 {
  return isRecord(value)
    && isNonEmptyString(value.profileId)
    && value.bareTreeBorn === true
    && isIsoInstant(value.bornAt)
    && value.leafLayoutVersion === V3_LEAF_LAYOUT_VERSION;
}

export function isDailyCheckInV3(value: unknown): value is DailyCheckInV3 {
  if (!isRecord(value) || !isRatingNine(value.mood) || !isRatingNine(value.energy)) return false;
  return typeof value.localDate === "string"
    && isLocalDateKey(value.localDate)
    && value.derivedStateCell === deriveDailyStateCell(value.mood, value.energy)
    && isDailyReadingSemantics(value.semanticReading)
    && value.semanticReading.sourceDate === value.localDate
    && value.semanticReading.stateCell === value.derivedStateCell
    && isIsoInstant(value.updatedAt);
}

function isCompletedSessionV3(value: unknown, index: number): value is CompletedSessionV3 {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.sessionId)
    && typeof value.localDate === "string"
    && isLocalDateKey(value.localDate)
    && (value.durationSeconds === 60 || value.durationSeconds === 300)
    && oneOf(value.ambientMode, AMBIENT_MODES)
    && isIsoInstant(value.startedAt)
    && isIsoInstant(value.completedAt)
    && Date.parse(value.completedAt) >= Date.parse(value.startedAt)
    && Date.parse(value.completedAt) - Date.parse(value.startedAt) >= value.durationSeconds * 1_000
    && value.leafIndex === index;
}

export function isMeditationProgressV3(value: unknown): value is MeditationProgressV3 {
  if (!isRecord(value) || !Array.isArray(value.sessions)) return false;
  if (!value.sessions.every((session, index) => isCompletedSessionV3(session, index))) return false;
  const sessions = value.sessions as CompletedSessionV3[];
  const identifiers = new Set(sessions.map((session) => session.sessionId));
  const seconds = sessions.reduce((total, session) => total + session.durationSeconds, 0);
  const latest = sessions.at(-1)?.completedAt;
  return isNonNegativeInteger(value.totalCompletedSessions)
    && value.totalCompletedSessions === sessions.length
    && isNonNegativeInteger(value.totalCompletedSeconds)
    && value.totalCompletedSeconds === seconds
    && isNonNegativeInteger(value.leafCount)
    && value.leafCount === sessions.length
    && identifiers.size === sessions.length
    && typeof value.audioMuted === "boolean"
    && typeof value.audioVolume === "number"
    && Number.isFinite(value.audioVolume)
    && value.audioVolume >= 0
    && value.audioVolume <= 1
    && (latest === undefined ? value.lastCompletedAt === undefined : value.lastCompletedAt === latest);
}

export function isNinefoldV3State(value: unknown): value is NinefoldV3State {
  if (!isRecord(value)
    || value.version !== V3_SCHEMA_VERSION
    || !isV3Profile(value.profile)
    || !isWorldStateV3(value.world)
    || !isRecord(value.checkIns)
    || !isMeditationProgressV3(value.meditation)) {
    return false;
  }
  if (value.world.profileId !== value.profile.id) return false;
  const profile = value.profile;
  return Object.entries(value.checkIns).every(([date, checkIn]) => {
    if (!isLocalDateKey(date) || !isDailyCheckInV3(checkIn) || checkIn.localDate !== date) return false;
    const expectedReading = createDailyReadingSemantics({
      localDate: date,
      stableSeed: profile.stableSeed,
      zodiacSign: profile.zodiacSign,
      personality: profile.personality,
      mood: checkIn.mood,
      energy: checkIn.energy,
    });
    return checkIn.semanticReading.personalityCode === profile.personality.code
      && checkIn.semanticReading.adviceId === expectedReading.adviceId;
  });
}

export function isDraftWorldIdentity(value: unknown): value is DraftWorldIdentity {
  if (!isRecord(value)) return false;
  const hasBirthMonth = value.birthMonth !== undefined;
  const hasBirthDay = value.birthDay !== undefined;
  if (hasBirthMonth !== hasBirthDay) return false;
  if (hasBirthMonth) {
    if (typeof value.birthMonth !== "number" || typeof value.birthDay !== "number") return false;
    if (!isValidBirthDate(value.birthMonth, value.birthDay)) return false;
    if (value.zodiacSign !== deriveZodiacSign(value.birthMonth, value.birthDay)) return false;
  } else if (value.zodiacSign !== undefined) {
    return false;
  }
  if (!isPartialPreferenceAnswers(value.personalityAnswers)) return false;
  const hasBirthIdentity = hasBirthMonth
    && oneOf(value.zodiacSign, ZODIAC_SIGNS);
  const hasCloudIdentity = hasBirthIdentity
    && oneOf(value.cloudArchetype, CLOUD_ARCHETYPES);
  const validWorldIdentity = hasCloudIdentity
    && oneOf(value.zodiacSign, ZODIAC_SIGNS)
    && oneOf(value.worldPrototype, PATH_NUMBERS);
  const stagePrerequisites = value.stage === "birth-date"
    || (value.stage === "cloud" && hasBirthIdentity && value.bareTreeBorn === false)
    || (value.stage === "world" && hasCloudIdentity && value.bareTreeBorn === false)
    || (value.stage === "first-breathing" && validWorldIdentity && value.bareTreeBorn === false)
    || ((value.stage === "nickname" || value.stage === "personality")
      && validWorldIdentity
      && value.bareTreeBorn === true);
  return value.version === V3_SCHEMA_VERSION
    && isNonEmptyString(value.stableSeed)
    && oneOf(value.stage, BUILDER_STAGES)
    && typeof value.bareTreeBorn === "boolean"
    && (!value.bareTreeBorn || validWorldIdentity)
    && isOptionalNickname(value.nickname)
    && (value.cloudArchetype === undefined || oneOf(value.cloudArchetype, CLOUD_ARCHETYPES))
    && (value.worldPrototype === undefined || oneOf(value.worldPrototype, PATH_NUMBERS))
    && oneOf(value.preferredAmbientMode, AMBIENT_MODES)
    && stagePrerequisites
    && isIsoInstant(value.updatedAt);
}

function isPartialPreferenceAnswers(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  return (value.eOrI === undefined || value.eOrI === "E" || value.eOrI === "I")
    && (value.sOrN === undefined || value.sOrN === "S" || value.sOrN === "N")
    && (value.tOrF === undefined || value.tOrF === "T" || value.tOrF === "F")
    && (value.jOrP === undefined || value.jOrP === "J" || value.jOrP === "P");
}

function isLocale(value: unknown): value is V3Locale {
  return value === "en" || value === "zh-CN";
}

function defaultBrowserStorage(): V3StorageLike | undefined {
  try {
    return (globalThis as { localStorage?: V3StorageLike }).localStorage;
  } catch {
    return undefined;
  }
}

export interface NinefoldV3Storage {
  readState(): NinefoldV3State | null;
  saveState(state: NinefoldV3State): V3StorageWriteResult;
  readDraft(): DraftWorldIdentity | null;
  saveDraft(draft: DraftWorldIdentity): V3StorageWriteResult;
  removeDraft(): V3StorageWriteResult;
  readLocale(): V3Locale | null;
  saveLocale(locale: V3Locale): V3StorageWriteResult;
  clearAll(): V3StorageWriteResult;
  hasAnyData(): boolean;
  getDiagnostics(): readonly V3StorageDiagnostic[];
  isAvailable(): boolean;
}

export function createNinefoldV3Storage(
  storage: V3StorageLike | undefined = defaultBrowserStorage(),
): NinefoldV3Storage {
  const diagnostics: V3StorageDiagnostic[] = [];
  let unavailableReported = false;

  const report = (diagnostic: V3StorageDiagnostic): void => {
    diagnostics.push(diagnostic);
  };

  const unavailable = (key: string): void => {
    if (unavailableReported) return;
    unavailableReported = true;
    report({ key, kind: "unavailable", message: "Browser storage is unavailable." });
  };

  const remove = (key: string): V3StorageWriteResult => {
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

  const read = <T>(key: string, validator: Validator<T>, fallback: T): T => {
    if (!storage) {
      unavailable(key);
      return fallback;
    }
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch {
      report({ key, kind: "read-failed", message: "Stored V3 data could not be read." });
      return fallback;
    }
    if (raw === null) return fallback;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed) || parsed.schemaVersion !== V3_SCHEMA_VERSION) {
        report({ key, kind: "outdated", message: "Unsupported V3 storage was safely ignored." });
        remove(key);
        return fallback;
      }
      if (!isIsoInstant(parsed.savedAt) || !validator(parsed.data)) {
        report({ key, kind: "corrupt", message: "Invalid V3 data was safely ignored." });
        remove(key);
        return fallback;
      }
      return parsed.data;
    } catch {
      report({ key, kind: "corrupt", message: "Unreadable V3 data was safely ignored." });
      remove(key);
      return fallback;
    }
  };

  const write = <T>(key: string, data: T): V3StorageWriteResult => {
    if (!storage) {
      unavailable(key);
      return { ok: false, error: "Browser storage is unavailable." };
    }
    const envelope: V3StorageEnvelope<T> = {
      schemaVersion: V3_SCHEMA_VERSION,
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

  return {
    readState: () => read(V3_STORAGE_KEYS.state, isNinefoldV3State, null),
    saveState: (state) => isNinefoldV3State(state)
      ? write(V3_STORAGE_KEYS.state, state)
      : { ok: false, error: "Invalid V3 state." },
    readDraft: () => read(V3_STORAGE_KEYS.draft, isDraftWorldIdentity, null),
    saveDraft: (draft) => isDraftWorldIdentity(draft)
      ? write(V3_STORAGE_KEYS.draft, draft)
      : { ok: false, error: "Invalid V3 builder draft." },
    removeDraft: () => remove(V3_STORAGE_KEYS.draft),
    readLocale: () => read(V3_STORAGE_KEYS.locale, isLocale, null),
    saveLocale: (locale) => isLocale(locale)
      ? write(V3_STORAGE_KEYS.locale, locale)
      : { ok: false, error: "Invalid V3 locale." },
    clearAll: () => {
      if (!storage) {
        unavailable(NINEFOLD_V3_STORAGE_PREFIX);
        return { ok: false, error: "Browser storage is unavailable." };
      }
      try {
        const keys: string[] = [];
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (key?.startsWith(NINEFOLD_V3_STORAGE_PREFIX)) keys.push(key);
        }
        keys.forEach((key) => storage.removeItem(key));
        return { ok: true };
      } catch {
        const error = "Ninefold V3 data could not be cleared.";
        report({ key: NINEFOLD_V3_STORAGE_PREFIX, kind: "write-failed", message: error });
        return { ok: false, error };
      }
    },
    hasAnyData: () => {
      if (!storage) return false;
      try {
        for (let index = 0; index < storage.length; index += 1) {
          if (storage.key(index)?.startsWith(NINEFOLD_V3_STORAGE_PREFIX)) return true;
        }
        return false;
      } catch {
        report({
          key: NINEFOLD_V3_STORAGE_PREFIX,
          kind: "read-failed",
          message: "Stored V3 data could not be inspected.",
        });
        return false;
      }
    },
    getDiagnostics: () => [...diagnostics],
    isAvailable: () => {
      if (!storage) return false;
      const probeKey = `${NINEFOLD_V3_STORAGE_PREFIX}__probe__`;
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

export const ninefoldV3Storage = createNinefoldV3Storage();
