import type { PathNumber } from "../../domain/types";

export const V3_SCHEMA_VERSION = 3 as const;

export const RATING_NINE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type RatingNine = (typeof RATING_NINE_VALUES)[number];

export const ZODIAC_SIGNS = [
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
] as const;
export type ZodiacSignV3 = (typeof ZODIAC_SIGNS)[number];

export const CLOUD_ARCHETYPES = [
  "high-veils",
  "layered-horizon",
  "soft-cumulus",
  "wind-drawn",
] as const;
export type CloudArchetype = (typeof CLOUD_ARCHETYPES)[number];

export const AMBIENT_MODES = ["ocean", "rain"] as const;
export type AmbientMode = (typeof AMBIENT_MODES)[number];

export type EOrI = "E" | "I";
export type SOrN = "S" | "N";
export type TOrF = "T" | "F";
export type JOrP = "J" | "P";
export type PersonalityCode = `${EOrI}${SOrN}${TOrF}${JOrP}`;

export interface PreferenceAnswersV3 {
  eOrI: EOrI;
  sOrN: SOrN;
  tOrF: TOrF;
  jOrP: JOrP;
}

export interface PersonalityPreferencesV3 extends PreferenceAnswersV3 {
  code: PersonalityCode;
}

export const STATE_BANDS = ["low", "mid", "high"] as const;
export type StateBand = (typeof STATE_BANDS)[number];
export type DailyStateCell = `${StateBand}-${StateBand}`;

export const KEYWORD_IDS = [
  "grounding",
  "gentleness",
  "clarity",
  "balance",
  "connection",
  "focus",
  "openness",
  "momentum",
  "renewal",
] as const;
export type KeywordId = (typeof KEYWORD_IDS)[number];

export const FAVOUR_IDS = [
  "one-small-task",
  "quiet-time",
  "gentle-movement",
  "clear-space",
  "warm-conversation",
  "single-priority",
  "slow-start",
  "make-notes",
  "finish-open-loop",
  "fresh-air",
  "protect-time",
  "ask-for-help",
  "simple-routine",
  "creative-play",
  "listen-first",
  "rest-between-tasks",
  "name-a-boundary",
  "share-a-thought",
] as const;
export type FavourId = (typeof FAVOUR_IDS)[number];

export const EASE_OFF_IDS = [
  "too-many-starts",
  "extra-commitments",
  "forced-answers",
  "constant-switching",
  "self-criticism",
  "rushed-decisions",
  "overexplaining",
  "crowded-schedule",
  "comparison",
  "all-or-nothing",
] as const;
export type EaseOffId = (typeof EASE_OFF_IDS)[number];

export type AdviceLetter = Lowercase<EOrI | SOrN | TOrF | JOrP>;
export type AdviceId = `${AdviceLetter}-${DailyStateCell}`;

export const V3_READING_VERSION = "ninefold-v3-reading-v1" as const;
export const V3_LEAF_LAYOUT_VERSION = "ninefold-v3-leaf-v1" as const;

export interface DailyReadingSemantics {
  version: typeof V3_READING_VERSION;
  sourceDate: string;
  personalityCode: PersonalityCode;
  stateCell: DailyStateCell;
  keywordId: KeywordId;
  favourIds: readonly [FavourId, FavourId, FavourId];
  easeOffIds: readonly [EaseOffId, EaseOffId];
  adviceId: AdviceId;
}

export interface DailyCheckInV3 {
  localDate: string;
  mood: RatingNine;
  energy: RatingNine;
  derivedStateCell: DailyStateCell;
  semanticReading: DailyReadingSemantics;
  updatedAt: string;
}

export interface V3Profile {
  version: typeof V3_SCHEMA_VERSION;
  id: string;
  stableSeed: string;
  nickname?: string;
  birthMonth: number;
  birthDay: number;
  zodiacSign: ZodiacSignV3;
  cloudArchetype: CloudArchetype;
  worldPrototype: PathNumber;
  personality: PersonalityPreferencesV3;
  createdAt: string;
  preferredAmbientMode: AmbientMode;
}

export const BUILDER_STAGES = [
  "birth-date",
  "cloud",
  "world",
  "first-breathing",
  "nickname",
  "personality",
] as const;
export type BuilderStage = (typeof BUILDER_STAGES)[number];

export interface DraftWorldIdentity {
  version: typeof V3_SCHEMA_VERSION;
  stableSeed: string;
  stage: BuilderStage;
  birthMonth?: number;
  birthDay?: number;
  zodiacSign?: ZodiacSignV3;
  cloudArchetype?: CloudArchetype;
  worldPrototype?: PathNumber;
  bareTreeBorn: boolean;
  nickname?: string;
  personalityAnswers?: Partial<PreferenceAnswersV3>;
  preferredAmbientMode: AmbientMode;
  updatedAt: string;
}

export interface WorldStateV3 {
  profileId: string;
  bareTreeBorn: true;
  bornAt: string;
  leafLayoutVersion: typeof V3_LEAF_LAYOUT_VERSION;
}

export type BreathingDurationSeconds = 60 | 300;

export interface CompletedSessionV3 {
  sessionId: string;
  localDate: string;
  durationSeconds: BreathingDurationSeconds;
  ambientMode: AmbientMode;
  startedAt: string;
  completedAt: string;
  leafIndex: number;
}

export interface MeditationProgressV3 {
  totalCompletedSessions: number;
  totalCompletedSeconds: number;
  leafCount: number;
  sessions: readonly CompletedSessionV3[];
  audioMuted: boolean;
  audioVolume: number;
  lastCompletedAt?: string;
}

export interface NinefoldV3State {
  version: typeof V3_SCHEMA_VERSION;
  profile: V3Profile;
  world: WorldStateV3;
  checkIns: Readonly<Record<string, DailyCheckInV3>>;
  meditation: MeditationProgressV3;
}

export type V3Locale = "en" | "zh-CN";
