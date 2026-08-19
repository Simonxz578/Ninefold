import type { DailyCheckIn, TimeOfDay, WeatherState } from "./types";

const clampUnit = (value: number): number => Math.max(0, Math.min(1, value));
const roundUnit = (value: number): number => Math.round(clampUnit(value) * 100) / 100;

const SUNLIGHT_BY_TIME: Readonly<Record<TimeOfDay, number>> = {
  morning: 0.72,
  day: 1,
  evening: 0.5,
  night: 0.08,
};

export function getTimeOfDay(localHour: number): TimeOfDay {
  if (!Number.isInteger(localHour) || localHour < 0 || localHour > 23) {
    throw new RangeError("Local hour must be an integer from 0 through 23.");
  }
  if (localHour >= 5 && localHour < 10) return "morning";
  if (localHour >= 10 && localHour < 17) return "day";
  if (localHour >= 17 && localHour < 21) return "evening";
  return "night";
}

/**
 * Converts the user's check-in into neutral visual weather. The function uses
 * no ambient clock or randomness; callers pass the broad time-of-day explicitly.
 */
export function deriveWeatherState(
  checkIn: DailyCheckIn,
  timeOfDay: TimeOfDay = "day",
): WeatherState {
  const energy = (checkIn.energy - 1) / 4;
  const clarity = (checkIn.clarity - 1) / 4;

  const skyClarity = roundUnit(0.12 + clarity * 0.8 + energy * 0.08);
  const cloudDensity = roundUnit(0.88 - clarity * 0.62 - energy * 0.12);
  const rainIntensity = roundUnit(
    (1 - clarity) * 0.46 + (1 - energy) * 0.18 - 0.2,
  );
  const windStrength = roundUnit(0.06 + energy * 0.76);
  const sunlight = roundUnit(
    (0.2 + clarity * 0.62 + energy * 0.18) * SUNLIGHT_BY_TIME[timeOfDay],
  );
  const starVisibility = roundUnit(
    timeOfDay === "night"
      ? 0.25 + clarity * 0.75
      : timeOfDay === "evening"
        ? clarity * 0.22
        : 0,
  );

  return {
    skyClarity,
    cloudDensity,
    rainIntensity,
    windStrength,
    sunlight,
    starVisibility,
    timeOfDay,
    motionBias: checkIn.connection,
    focusMotif: checkIn.focus,
  };
}
