import { calculateScores } from "./scores";
import { SYMBOL_DICTIONARY_VERSION } from "./symbols";
import { COLOR_NAMES, DIRECTIONS, FORM_NAMES, PATH_NUMBERS } from "./types";
import type {
  ColorName,
  DailyCheckIn,
  GeometricForm,
  PatternConfiguration,
  Profile,
  Symmetry,
} from "./types";
import { createSeededPrng, isLocalDateKey } from "./prng";

export const GENERATOR_VERSION = "ninefold-generator-v1";
export const REFRAME_VERSION = "reframe-v1";

const SYMMETRIES: readonly Symmetry[] = ["radial", "bilateral", "rotational", "asymmetric"];

const roundTo = (value: number, places: number): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

function assertGenerationInput(profile: Profile, checkIn: DailyCheckIn, date: string): void {
  if (profile.id.trim().length === 0) throw new TypeError("Profile ID is required.");
  if (!PATH_NUMBERS.includes(profile.pathNumber)) throw new RangeError("Path number must be 1–9.");
  if (!isLocalDateKey(date)) throw new RangeError("Date must use local YYYY-MM-DD format.");
  if (checkIn.energy < 1 || checkIn.energy > 5 || checkIn.clarity < 1 || checkIn.clarity > 5) {
    throw new RangeError("Energy and clarity must be between 1 and 5.");
  }
  if ((checkIn.note?.length ?? 0) > 280) throw new RangeError("A check-in note is limited to 280 characters.");
}

export function buildOriginalSeed(profile: Pick<Profile, "id" | "pathNumber">, date: string): string {
  if (!isLocalDateKey(date)) throw new RangeError("Date must use local YYYY-MM-DD format.");
  // JSON encoding prevents separator characters in an ID from making two inputs ambiguous.
  return JSON.stringify([GENERATOR_VERSION, profile.id, date, profile.pathNumber]);
}

const without = <T>(values: readonly T[], excluded: readonly T[]): T[] =>
  values.filter((value) => !excluded.includes(value));

function generateVisualFields(seed: string, exclusions?: {
  primaryColor: ColorName;
  secondaryColor: ColorName;
  form: GeometricForm;
}): Omit<
  PatternConfiguration,
  | "generatorVersion"
  | "dictionaryVersion"
  | "seed"
  | "date"
  | "variant"
  | "pathNumber"
  | "dailyNumber"
  | "scores"
> {
  const random = createSeededPrng(seed);
  const primaryPool = exclusions ? without(COLOR_NAMES, [exclusions.primaryColor]) : [...COLOR_NAMES];
  const primaryColor = random.pick(primaryPool);
  const secondaryPool = without(
    COLOR_NAMES,
    exclusions ? [primaryColor, exclusions.secondaryColor] : [primaryColor],
  );
  const secondaryColor = random.pick(secondaryPool);
  const form = random.pick(exclusions ? without(FORM_NAMES, [exclusions.form]) : FORM_NAMES);

  return {
    primaryColor,
    secondaryColor,
    form,
    rotation: random.integer(0, 359),
    layerCount: random.integer(4, 9),
    density: roundTo(random.float(0.4, 0.92), 2),
    direction: random.pick(DIRECTIONS),
    symmetry: random.pick(SYMMETRIES),
    lineWeight: roundTo(random.float(0.7, 2.6), 2),
    opacityProfile: {
      base: roundTo(random.float(0.16, 0.38), 2),
      accent: roundTo(random.float(0.46, 0.78), 2),
      line: roundTo(random.float(0.48, 0.86), 2),
    },
  };
}

export function generateOriginalConfiguration(
  profile: Profile,
  checkIn: DailyCheckIn,
  date: string,
): PatternConfiguration {
  assertGenerationInput(profile, checkIn, date);
  const seed = buildOriginalSeed(profile, date);
  const random = createSeededPrng(`${seed}|number`);
  const dailyNumber = random.pick(PATH_NUMBERS);
  const visuals = generateVisualFields(`${seed}|visuals`);
  const scores = calculateScores(profile, checkIn, { dailyNumber, ...visuals });

  return {
    generatorVersion: GENERATOR_VERSION,
    dictionaryVersion: SYMBOL_DICTIONARY_VERSION,
    seed,
    date,
    variant: "original",
    pathNumber: profile.pathNumber,
    dailyNumber,
    ...visuals,
    scores,
  };
}

export function buildReframeSeed(originalSeed: string): string {
  return `${originalSeed}|${REFRAME_VERSION}`;
}

export function generateReframeConfiguration(
  original: PatternConfiguration,
  profile: Profile,
  checkIn: DailyCheckIn,
): PatternConfiguration {
  assertGenerationInput(profile, checkIn, original.date);
  if (original.variant !== "original") throw new TypeError("A Reframe must be based on an original configuration.");
  if (original.pathNumber !== profile.pathNumber) throw new TypeError("The Reframe profile does not match the original.");
  const seed = buildReframeSeed(original.seed);
  const visuals = generateVisualFields(`${seed}|visuals`, {
    primaryColor: original.primaryColor,
    secondaryColor: original.secondaryColor,
    form: original.form,
  });

  return {
    generatorVersion: GENERATOR_VERSION,
    dictionaryVersion: SYMBOL_DICTIONARY_VERSION,
    seed,
    date: original.date,
    variant: "reframe",
    pathNumber: original.pathNumber,
    dailyNumber: original.dailyNumber,
    ...visuals,
    scores: { ...original.scores },
  };
}

export interface PatternRangeValidation {
  valid: boolean;
  errors: string[];
}

export function validatePatternRanges(configuration: PatternConfiguration): PatternRangeValidation {
  const errors: string[] = [];
  if (!PATH_NUMBERS.includes(configuration.dailyNumber)) errors.push("dailyNumber");
  if (!COLOR_NAMES.includes(configuration.primaryColor)) errors.push("primaryColor");
  if (!COLOR_NAMES.includes(configuration.secondaryColor)) errors.push("secondaryColor");
  if (configuration.primaryColor === configuration.secondaryColor) errors.push("distinctColors");
  if (!FORM_NAMES.includes(configuration.form)) errors.push("form");
  if (!DIRECTIONS.includes(configuration.direction)) errors.push("direction");
  if (!Number.isInteger(configuration.rotation) || configuration.rotation < 0 || configuration.rotation > 359) errors.push("rotation");
  if (!Number.isInteger(configuration.layerCount) || configuration.layerCount < 4 || configuration.layerCount > 9) errors.push("layerCount");
  if (!Number.isFinite(configuration.density) || configuration.density < 0.4 || configuration.density > 0.92) errors.push("density");
  if (!Number.isFinite(configuration.lineWeight) || configuration.lineWeight < 0.7 || configuration.lineWeight > 2.6) errors.push("lineWeight");
  if (!Number.isFinite(configuration.opacityProfile.base) || configuration.opacityProfile.base < 0.16 || configuration.opacityProfile.base > 0.38) errors.push("opacityBase");
  if (!Number.isFinite(configuration.opacityProfile.accent) || configuration.opacityProfile.accent < 0.46 || configuration.opacityProfile.accent > 0.78) errors.push("opacityAccent");
  if (!Number.isFinite(configuration.opacityProfile.line) || configuration.opacityProfile.line < 0.48 || configuration.opacityProfile.line > 0.86) errors.push("opacityLine");
  for (const [name, score] of Object.entries(configuration.scores)) {
    if (!Number.isInteger(score) || score < 1 || score > 9) errors.push(`scores.${name}`);
  }
  return { valid: errors.length === 0, errors };
}
