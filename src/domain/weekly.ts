import { COLOR_NAMES, DIRECTIONS, FORM_NAMES } from "./types";
import type {
  ColorName,
  DailyEntry,
  DailyScores,
  GeometricForm,
  ScoreNine,
  VisualDirection,
  WeeklyReflection,
} from "./types";
import { getActiveVersion } from "./daily";

const clampAverage = (value: number): ScoreNine =>
  Math.max(1, Math.min(9, Math.round(value))) as ScoreNine;

function averageScores(entries: readonly DailyEntry[]): DailyScores {
  if (entries.length === 0) return { clarity: 5, momentum: 5, tension: 5 };
  const totals = entries.reduce(
    (sum, entry) => {
      const scores = getActiveVersion(entry).configuration.scores;
      return {
        clarity: sum.clarity + scores.clarity,
        momentum: sum.momentum + scores.momentum,
        tension: sum.tension + scores.tension,
      };
    },
    { clarity: 0, momentum: 0, tension: 0 },
  );
  return {
    clarity: clampAverage(totals.clarity / entries.length),
    momentum: clampAverage(totals.momentum / entries.length),
    tension: clampAverage(totals.tension / entries.length),
  };
}

function rankedValues<T extends string>(values: readonly T[], order: readonly T[]): Array<[T, number]> {
  const counts = new Map<T, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort(
    ([left, leftCount], [right, rightCount]) =>
      rightCount - leftCount || order.indexOf(left) - order.indexOf(right),
  );
}

function movementObservation(label: string, start: number, end: number): string {
  const delta = end - start;
  if (Math.abs(delta) <= 1) return `${label} stayed relatively steady across the visible week.`;
  return `${label} moved ${delta > 0 ? "up" : "down"} from ${start} to ${end} across the visible week.`;
}

export function createWeeklyReflection(allEntries: DailyEntry[]): WeeklyReflection {
  const entries = [...allEntries].sort((left, right) => left.date.localeCompare(right.date)).slice(-7);
  if (entries.length === 0) {
    return {
      theme: "A week waiting to take shape",
      observations: ["Complete a daily check-in or load the sample week to reveal recurring symbols."],
      invitation: "Notice one thing you would like to observe without trying to predict it.",
      averages: { clarity: 5, momentum: 5, tension: 5 },
      frequentColors: [],
      repeatedForms: [],
      dominantDirection: "balanced",
    };
  }

  const versions = entries.map(getActiveVersion);
  const colors = versions.map((version) => version.configuration.primaryColor);
  const forms = versions.map((version) => version.configuration.form);
  const directions = versions.map((version) => version.configuration.direction);
  const colorRanking = rankedValues<ColorName>(colors, COLOR_NAMES);
  const formRanking = rankedValues<GeometricForm>(forms, FORM_NAMES);
  const directionRanking = rankedValues<VisualDirection>(directions, DIRECTIONS);
  const topColorCount = colorRanking[0]?.[1] ?? 0;
  const frequentColors = colorRanking
    .filter(([, count]) => count === topColorCount)
    .map(([color]) => color);
  const repeatedForms = formRanking.filter(([, count]) => count > 1).map(([form]) => form);
  const dominantDirection = directionRanking[0]?.[0] ?? "balanced";
  const first = versions[0]?.configuration.scores;
  const last = versions.at(-1)?.configuration.scores;
  const observations = [
    `${dominantDirection[0]?.toUpperCase()}${dominantDirection.slice(1)} was the most frequent visual direction.`,
    repeatedForms.length > 0
      ? `${repeatedForms.join(" and ")} repeated, creating a visible structural rhythm.`
      : "No form dominated; the week showed a varied geometric rhythm.",
  ];
  if (first && last && entries.length > 1) {
    observations.push(movementObservation("Clarity", first.clarity, last.clarity));
    observations.push(movementObservation("Momentum", first.momentum, last.momentum));
  }

  return {
    theme: `${frequentColors.join(" and ")} in ${dominantDirection} motion`,
    observations,
    invitation: "Look for the repeated symbol that best describes what you practised, not what will happen next.",
    averages: averageScores(entries),
    frequentColors,
    repeatedForms,
    dominantDirection,
  };
}
