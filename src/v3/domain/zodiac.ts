import type { ZodiacSignV3 } from "./types";

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/** Validates a recurring month/day without requiring a year. Feb 29 is valid. */
export function isValidBirthDate(month: number, day: number): boolean {
  if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12) {
    return false;
  }
  const maximum = DAYS_IN_MONTH[month - 1];
  return maximum !== undefined && day >= 1 && day <= maximum;
}

/**
 * Fixed Western/tropical zodiac boundaries. This is symbolic local content,
 * not an astronomical reconstruction of a birth sky.
 */
export function deriveZodiacSign(month: number, day: number): ZodiacSignV3 {
  if (!isValidBirthDate(month, day)) {
    throw new RangeError("Birth date must be a valid month/day; Feb 29 is allowed.");
  }

  const value = month * 100 + day;
  if (value >= 321 && value <= 419) return "aries";
  if (value >= 420 && value <= 520) return "taurus";
  if (value >= 521 && value <= 620) return "gemini";
  if (value >= 621 && value <= 722) return "cancer";
  if (value >= 723 && value <= 822) return "leo";
  if (value >= 823 && value <= 922) return "virgo";
  if (value >= 923 && value <= 1022) return "libra";
  if (value >= 1023 && value <= 1121) return "scorpio";
  if (value >= 1122 && value <= 1221) return "sagittarius";
  if (value >= 1222 || value <= 119) return "capricorn";
  if (value >= 120 && value <= 218) return "aquarius";
  return "pisces";
}
