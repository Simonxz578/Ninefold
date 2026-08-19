import {
  getColorSymbol,
  getDirectionSymbol,
  getFormSymbol,
  getNumberSymbol,
  type ScoreInfluence,
} from "./symbols";
import type {
  DailyCheckIn,
  DailyScores,
  PatternConfiguration,
  Profile,
  ScoreNine,
  VisualDirection,
} from "./types";

const scaleFiveToNine = (value: number): number => value * 2 - 1;

const clampScore = (value: number): ScoreNine =>
  Math.max(1, Math.min(9, Math.round(value))) as ScoreNine;

function connectionAlignment(
  connection: DailyCheckIn["connection"],
  direction: VisualDirection,
): number {
  if (connection === "balanced") return direction === "balanced" ? 8 : 5;
  const inwardDirections: readonly VisualDirection[] = ["inward", "descending"];
  const outwardDirections: readonly VisualDirection[] = ["outward", "ascending"];
  const matches =
    connection === "inward"
      ? inwardDirections.includes(direction)
      : outwardDirections.includes(direction);
  const opposes =
    connection === "inward"
      ? outwardDirections.includes(direction)
      : inwardDirections.includes(direction);
  return matches ? 8 : opposes ? 3 : 5;
}

function meanInfluence(
  influences: readonly ScoreInfluence[],
  field: keyof ScoreInfluence,
): number {
  return influences.reduce((total, influence) => total + influence[field], 0) / influences.length;
}

export type ScoreSymbolFields = Pick<
  PatternConfiguration,
  "dailyNumber" | "primaryColor" | "secondaryColor" | "form" | "direction"
>;

/**
 * Scores deliberately remain transparent rather than pretending to measure a
 * hidden state. Five-point check-in values are mapped to 1–9. Clarity weights
 * clarity/energy/alignment 72/14/14; Momentum weights them 22/62/16; Tension
 * weights inverse energy/inverse clarity/inverse alignment 54/30/16. A small
 * Path bias (0.55) and the mean bias of five generated symbols (0.35) are then
 * applied before rounding and clamping to 1–9.
 */
export function calculateScores(
  profile: Profile,
  checkIn: DailyCheckIn,
  symbols: ScoreSymbolFields,
): DailyScores {
  const clarity = scaleFiveToNine(checkIn.clarity);
  const energy = scaleFiveToNine(checkIn.energy);
  const alignment = connectionAlignment(checkIn.connection, symbols.direction);
  const pathInfluence = getNumberSymbol(profile.pathNumber).scoreInfluence;
  const symbolInfluences = [
    getNumberSymbol(symbols.dailyNumber).scoreInfluence,
    getColorSymbol(symbols.primaryColor).scoreInfluence,
    getColorSymbol(symbols.secondaryColor).scoreInfluence,
    getFormSymbol(symbols.form).scoreInfluence,
    getDirectionSymbol(symbols.direction).scoreInfluence,
  ];

  const symbolic = (field: keyof ScoreInfluence): number =>
    pathInfluence[field] * 0.55 + meanInfluence(symbolInfluences, field) * 0.35;

  return {
    clarity: clampScore(
      clarity * 0.72 + energy * 0.14 + alignment * 0.14 + symbolic("clarity"),
    ),
    momentum: clampScore(
      energy * 0.62 + clarity * 0.22 + alignment * 0.16 + symbolic("momentum"),
    ),
    tension: clampScore(
      (10 - energy) * 0.54 +
        (10 - clarity) * 0.3 +
        (10 - alignment) * 0.16 +
        symbolic("tension"),
    ),
  };
}
