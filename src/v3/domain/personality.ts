import type {
  PersonalityCode,
  PersonalityPreferencesV3,
  PreferenceAnswersV3,
} from "./types";

export const PERSONALITY_CODES = [
  "ESTJ", "ESTP", "ESFJ", "ESFP",
  "ENTJ", "ENTP", "ENFJ", "ENFP",
  "ISTJ", "ISTP", "ISFJ", "ISFP",
  "INTJ", "INTP", "INFJ", "INFP",
] as const satisfies readonly PersonalityCode[];

export function derivePersonalityPreferences(
  answers: PreferenceAnswersV3,
): PersonalityPreferencesV3 {
  if (!isPreferenceAnswers(answers)) {
    throw new TypeError("All four personality preference answers are required.");
  }
  return {
    ...answers,
    code: `${answers.eOrI}${answers.sOrN}${answers.tOrF}${answers.jOrP}`,
  };
}

export function isPersonalityCode(value: unknown): value is PersonalityCode {
  return typeof value === "string"
    && (PERSONALITY_CODES as readonly string[]).includes(value);
}

export function isPreferenceAnswers(value: unknown): value is PreferenceAnswersV3 {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (candidate.eOrI === "E" || candidate.eOrI === "I")
    && (candidate.sOrN === "S" || candidate.sOrN === "N")
    && (candidate.tOrF === "T" || candidate.tOrF === "F")
    && (candidate.jOrP === "J" || candidate.jOrP === "P");
}

export function isPersonalityPreferences(value: unknown): value is PersonalityPreferencesV3 {
  if (!isPreferenceAnswers(value)) return false;
  const candidate = value as PersonalityPreferencesV3;
  return isPersonalityCode(candidate.code)
    && candidate.code === `${candidate.eOrI}${candidate.sOrN}${candidate.tOrF}${candidate.jOrP}`;
}
