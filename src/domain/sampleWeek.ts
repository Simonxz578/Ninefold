import { createDailyEntry } from "./daily";
import { shiftLocalDate } from "./prng";
import type { DailyCheckIn, DailyEntry, PathNumber, Profile } from "./types";

export const SAMPLE_PROFILE: Profile = {
  id: "ninefold-sample-profile-v1",
  displayName: "Sample",
  pathNumber: 7,
  lenses: { approach: "neutral", processing: "neutral", pace: "neutral", orientation: "neutral" },
  createdAt: "2026-01-01T12:00:00.000Z",
};

const SAMPLE_CHECK_INS: readonly DailyCheckIn[] = [
  { energy: 2, clarity: 3, connection: "inward", focus: "self" },
  { energy: 4, clarity: 2, connection: "outward", focus: "creativity" },
  { energy: 3, clarity: 4, connection: "balanced", focus: "work" },
  { energy: 5, clarity: 3, connection: "outward", focus: "relationships" },
  { energy: 2, clarity: 5, connection: "inward", focus: "study" },
  { energy: 4, clarity: 4, connection: "balanced", focus: "creativity" },
  { energy: 3, clarity: 3, connection: "balanced", focus: "self" },
];

const SAMPLE_PATHS: readonly PathNumber[] = [1, 2, 3, 5, 6, 8, 9];

export function createSampleWeek(anchorDate: string, profile: Profile = SAMPLE_PROFILE): DailyEntry[] {
  const recent = [];
  const entries: DailyEntry[] = [];
  for (let index = 0; index < 7; index += 1) {
    const date = shiftLocalDate(anchorDate, index - 6);
    const checkIn = SAMPLE_CHECK_INS[index];
    if (!checkIn) continue;
    const pathNumber = SAMPLE_PATHS[index] ?? profile.pathNumber;
    const sampleProfile: Profile = {
      ...profile,
      id: `${profile.id}-path-${pathNumber}`,
      pathNumber,
    };
    const entry = createDailyEntry(sampleProfile, checkIn, date, {
      recentSummaries: recent,
      now: `${date}T12:00:00.000Z`,
      isSample: true,
      sampleLabel: `Sample day ${index + 1}`,
    });
    entries.push(entry);
    recent.push({
      date,
      dailyNumber: entry.original.configuration.dailyNumber,
      primaryColor: entry.original.configuration.primaryColor,
      form: entry.original.configuration.form,
      direction: entry.original.configuration.direction,
      scores: entry.original.configuration.scores,
      theme: entry.original.reflection.theme,
    });
  }
  return entries;
}

export interface SampleMergeOptions {
  /** Must only be set after an explicit user confirmation. */
  confirmedRealOverwrite?: boolean;
}

export type SampleMergeResult =
  | { status: "merged"; entries: DailyEntry[]; replacedRealDates: string[] }
  | { status: "conflict"; entries: DailyEntry[]; conflictingDates: string[] };

export function mergeSampleWeek(
  existingEntries: readonly DailyEntry[],
  sampleEntries: readonly DailyEntry[],
  options: SampleMergeOptions = {},
): SampleMergeResult {
  const sampleDates = new Set(sampleEntries.map((entry) => entry.date));
  const conflictingDates = existingEntries
    .filter((entry) => sampleDates.has(entry.date) && !entry.isSample)
    .map((entry) => entry.date)
    .sort();
  if (conflictingDates.length > 0 && !options.confirmedRealOverwrite) {
    return { status: "conflict", entries: [...existingEntries], conflictingDates };
  }

  const byDate = new Map(existingEntries.map((entry) => [entry.date, entry]));
  sampleEntries.forEach((entry) => byDate.set(entry.date, entry));
  return {
    status: "merged",
    entries: [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date)),
    replacedRealDates: conflictingDates,
  };
}

export function removeSampleEntries(entries: readonly DailyEntry[]): DailyEntry[] {
  return entries.filter((entry) => !entry.isSample);
}
