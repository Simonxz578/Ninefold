import { createSeededPrng, isLocalDateKey } from "../../domain/prng";
import { isPersonalityCode, isPersonalityPreferences } from "./personality";
import {
  EASE_OFF_IDS,
  FAVOUR_IDS,
  KEYWORD_IDS,
  RATING_NINE_VALUES,
  STATE_BANDS,
  V3_READING_VERSION,
  ZODIAC_SIGNS,
  type AdviceId,
  type AdviceLetter,
  type DailyReadingSemantics,
  type DailyStateCell,
  type EaseOffId,
  type FavourId,
  type KeywordId,
  type PersonalityPreferencesV3,
  type RatingNine,
  type StateBand,
  type ZodiacSignV3,
} from "./types";

const KEYWORDS_BY_STATE: Readonly<Record<DailyStateCell, readonly KeywordId[]>> = {
  "low-low": ["grounding", "gentleness", "renewal"],
  "low-mid": ["gentleness", "balance", "clarity"],
  "low-high": ["balance", "focus", "grounding"],
  "mid-low": ["renewal", "grounding", "openness"],
  "mid-mid": ["balance", "clarity", "connection"],
  "mid-high": ["focus", "openness", "momentum"],
  "high-low": ["gentleness", "connection", "renewal"],
  "high-mid": ["connection", "openness", "clarity"],
  "high-high": ["momentum", "openness", "focus"],
};

const FAVOURS_BY_STATE: Readonly<Record<DailyStateCell, readonly FavourId[]>> = {
  "low-low": ["one-small-task", "quiet-time", "slow-start", "protect-time", "rest-between-tasks", "simple-routine"],
  "low-mid": ["one-small-task", "make-notes", "gentle-movement", "clear-space", "protect-time", "fresh-air"],
  "low-high": ["single-priority", "gentle-movement", "finish-open-loop", "make-notes", "name-a-boundary", "fresh-air"],
  "mid-low": ["slow-start", "quiet-time", "simple-routine", "listen-first", "rest-between-tasks", "clear-space"],
  "mid-mid": ["single-priority", "warm-conversation", "clear-space", "make-notes", "listen-first", "creative-play"],
  "mid-high": ["finish-open-loop", "single-priority", "share-a-thought", "creative-play", "fresh-air", "make-notes"],
  "high-low": ["warm-conversation", "quiet-time", "creative-play", "rest-between-tasks", "share-a-thought", "gentle-movement"],
  "high-mid": ["warm-conversation", "creative-play", "share-a-thought", "fresh-air", "ask-for-help", "listen-first"],
  "high-high": ["single-priority", "finish-open-loop", "share-a-thought", "creative-play", "warm-conversation", "fresh-air"],
};

const EASE_OFF_BY_STATE: Readonly<Record<DailyStateCell, readonly EaseOffId[]>> = {
  "low-low": ["extra-commitments", "self-criticism", "crowded-schedule", "all-or-nothing", "forced-answers"],
  "low-mid": ["extra-commitments", "constant-switching", "self-criticism", "rushed-decisions", "comparison"],
  "low-high": ["too-many-starts", "constant-switching", "rushed-decisions", "overexplaining", "all-or-nothing"],
  "mid-low": ["crowded-schedule", "forced-answers", "self-criticism", "extra-commitments", "comparison"],
  "mid-mid": ["constant-switching", "too-many-starts", "comparison", "overexplaining", "rushed-decisions"],
  "mid-high": ["too-many-starts", "extra-commitments", "constant-switching", "rushed-decisions", "all-or-nothing"],
  "high-low": ["crowded-schedule", "overexplaining", "forced-answers", "extra-commitments", "comparison"],
  "high-mid": ["too-many-starts", "constant-switching", "overexplaining", "comparison", "rushed-decisions"],
  "high-high": ["too-many-starts", "extra-commitments", "constant-switching", "all-or-nothing", "rushed-decisions"],
};

export interface DailyReadingInput {
  localDate: string;
  stableSeed: string;
  zodiacSign: ZodiacSignV3;
  personality: PersonalityPreferencesV3;
  mood: RatingNine;
  energy: RatingNine;
}

export function isRatingNine(value: unknown): value is RatingNine {
  return typeof value === "number" && RATING_NINE_VALUES.some((item) => item === value);
}

export function deriveStateBand(value: RatingNine): StateBand {
  if (!isRatingNine(value)) throw new RangeError("Daily ratings must be integers from 1 to 9.");
  if (value <= 3) return "low";
  if (value <= 6) return "mid";
  return "high";
}

export function deriveDailyStateCell(mood: RatingNine, energy: RatingNine): DailyStateCell {
  return `${deriveStateBand(mood)}-${deriveStateBand(energy)}`;
}

export function isDailyStateCell(value: unknown): value is DailyStateCell {
  if (typeof value !== "string") return false;
  const [moodBand, energyBand, extra] = value.split("-");
  return extra === undefined
    && STATE_BANDS.some((band) => band === moodBand)
    && STATE_BANDS.some((band) => band === energyBand);
}

export function buildDailyReadingSeed(input: Pick<
  DailyReadingInput,
  "localDate" | "stableSeed" | "zodiacSign" | "personality"
> & { stateCell: DailyStateCell }): string {
  if (!isLocalDateKey(input.localDate)) throw new RangeError("Reading date must be local YYYY-MM-DD.");
  if (input.stableSeed.trim().length === 0) throw new TypeError("A stable profile seed is required.");
  if (!ZODIAC_SIGNS.some((sign) => sign === input.zodiacSign)) throw new TypeError("Zodiac sign is invalid.");
  if (!isPersonalityPreferences(input.personality)) throw new TypeError("Personality preferences are invalid.");
  if (!isDailyStateCell(input.stateCell)) throw new TypeError("Daily state cell is invalid.");
  return JSON.stringify([
    V3_READING_VERSION,
    input.localDate,
    input.stableSeed,
    input.zodiacSign,
    input.personality.code,
    input.stateCell,
  ]);
}

export function createDailyReadingSemantics(input: DailyReadingInput): DailyReadingSemantics {
  const stateCell = deriveDailyStateCell(input.mood, input.energy);
  const seed = buildDailyReadingSeed({ ...input, stateCell });
  const keywordId = createSeededPrng(`${seed}|keyword`).pick(KEYWORDS_BY_STATE[stateCell]);
  const favourIds = pickDistinct(FAVOURS_BY_STATE[stateCell], 3, `${seed}|favour`);
  const easeOffIds = pickDistinct(EASE_OFF_BY_STATE[stateCell], 2, `${seed}|ease-off`);
  const axis = createSeededPrng(`${seed}|advice-axis`).integer(0, 3);
  const letters = [
    input.personality.eOrI,
    input.personality.sOrN,
    input.personality.tOrF,
    input.personality.jOrP,
  ] as const;
  const adviceLetter = letters[axis]?.toLowerCase() as AdviceLetter;

  return {
    version: V3_READING_VERSION,
    sourceDate: input.localDate,
    personalityCode: input.personality.code,
    stateCell,
    keywordId,
    favourIds: favourIds as [FavourId, FavourId, FavourId],
    easeOffIds: easeOffIds as [EaseOffId, EaseOffId],
    adviceId: `${adviceLetter}-${stateCell}`,
  };
}

export function isDailyReadingSemantics(value: unknown): value is DailyReadingSemantics {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return candidate.version === V3_READING_VERSION
    && typeof candidate.sourceDate === "string"
    && isLocalDateKey(candidate.sourceDate)
    && isPersonalityCode(candidate.personalityCode)
    && isDailyStateCell(candidate.stateCell)
    && typeof candidate.keywordId === "string"
    && (KEYWORD_IDS as readonly string[]).includes(candidate.keywordId)
    && isIdTuple(candidate.favourIds, FAVOUR_IDS, 3)
    && isIdTuple(candidate.easeOffIds, EASE_OFF_IDS, 2)
    && isAdviceId(candidate.adviceId);
}

function pickDistinct<T>(values: readonly T[], count: number, seed: string): T[] {
  if (count < 0 || count > values.length) throw new RangeError("Distinct selection exceeds its pool.");
  const random = createSeededPrng(seed);
  const pool = [...values];
  for (let index = 0; index < count; index += 1) {
    const selected = random.integer(index, pool.length - 1);
    [pool[index], pool[selected]] = [pool[selected] as T, pool[index] as T];
  }
  return pool.slice(0, count);
}

function isIdTuple<T extends string>(
  value: unknown,
  values: readonly T[],
  length: number,
): value is readonly T[] {
  return Array.isArray(value)
    && value.length === length
    && new Set(value).size === value.length
    && value.every((item) => typeof item === "string" && values.includes(item as T));
}

function isAdviceId(value: unknown): value is AdviceId {
  if (typeof value !== "string") return false;
  const match = /^([eisntfjp])-(low|mid|high)-(low|mid|high)$/.exec(value);
  return Boolean(match);
}
