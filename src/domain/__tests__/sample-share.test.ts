import {
  buildLocalizedShareCaption,
  buildShareCaption,
  COLOR_NAMES,
  createDailyEntry,
  createSampleWeek,
  DIRECTIONS,
  formatReflectionForLocale,
  FORM_NAMES,
  mergeSampleWeek,
  removeSampleEntries,
  ZH_SEMANTIC_LABELS,
} from "../index";
import type { DailyCheckIn, Profile } from "../types";

const profile: Profile = {
  id: "real-profile",
  pathNumber: 9,
  createdAt: "2026-07-01T00:00:00.000Z",
};

const privateNote = "PRIVATE-NOTE-should-never-be-shared";
const checkIn: DailyCheckIn = {
  energy: 3,
  clarity: 4,
  connection: "balanced",
  focus: "relationships",
  note: privateNote,
};

describe("safe sharing", () => {
  it("excludes the private note, profile ID and storage detail from captions", () => {
    const entry = createDailyEntry(profile, checkIn, "2026-07-13");
    const caption = buildShareCaption(profile, entry);

    expect(caption).toContain("My Ninefold pattern today:");
    expect(caption).toContain(`Path ${profile.pathNumber}`);
    expect(caption).toContain("Theme:");
    expect(caption).not.toContain(privateNote);
    expect(caption).not.toContain(profile.id);
    expect(caption).not.toContain("localStorage");
  });

  it("localizes every Chinese semantic enum without leaking its English storage value", () => {
    const baseEntry = createDailyEntry(profile, checkIn, "2026-07-13");
    const rawEnums = [...COLOR_NAMES, ...FORM_NAMES, ...DIRECTIONS];

    COLOR_NAMES.forEach((primaryColor, index) => {
      const form = FORM_NAMES[index % FORM_NAMES.length] ?? "circle";
      const direction = DIRECTIONS[index % DIRECTIONS.length] ?? "balanced";
      const entry = {
        ...baseEntry,
        original: {
          ...baseEntry.original,
          configuration: {
            ...baseEntry.original.configuration,
            primaryColor,
            form,
            direction,
          },
        },
      };
      const caption = buildLocalizedShareCaption(profile, entry, "zh-CN", "归一");

      expect(caption).toContain(ZH_SEMANTIC_LABELS.colours[primaryColor]);
      expect(caption).toContain(ZH_SEMANTIC_LABELS.forms[form]);
      rawEnums.forEach((rawValue) => expect(caption).not.toContain(rawValue));
      expect(caption).not.toContain(privateNote);
      expect(caption).not.toContain(profile.id);
      expect(buildLocalizedShareCaption(profile, entry, "zh-CN", "归一")).toBe(caption);
    });
  });

  it("keeps the existing English caption format and localized theme", () => {
    const entry = createDailyEntry(profile, checkIn, "2026-07-13");
    const reflection = formatReflectionForLocale({
      path: entry.original.configuration.pathNumber,
      checkIn: entry.checkIn,
      configuration: entry.original.configuration,
    }, "en");
    const existingEnglishCaption = buildShareCaption(profile, {
      ...entry,
      original: { ...entry.original, reflection },
    });

    expect(buildLocalizedShareCaption(profile, entry, "en", "Unify")).toBe(existingEnglishCaption);
    expect(existingEnglishCaption).toContain(entry.original.configuration.primaryColor);
    expect(existingEnglishCaption).toContain(
      `${entry.original.configuration.form[0]?.toUpperCase()}${entry.original.configuration.form.slice(1)}`,
    );
  });
});

describe("deterministic sample week", () => {
  it("creates the same seven clearly labelled sample entries", () => {
    const first = createSampleWeek("2026-07-13");
    const second = createSampleWeek("2026-07-13");

    expect(first).toHaveLength(7);
    expect(second).toEqual(first);
    expect(first.every((entry) => entry.isSample && entry.sampleLabel?.startsWith("Sample day"))).toBe(true);
    expect(new Set(first.map((entry) => entry.date)).size).toBe(7);
    expect(new Set(first.map((entry) => entry.original.configuration.primaryColor)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(first.map((entry) => entry.original.configuration.form)).size).toBeGreaterThanOrEqual(4);
  });

  it("does not silently overwrite a real entry with a sample", () => {
    const real = createDailyEntry(profile, checkIn, "2026-07-13", {
      now: "2026-07-13T08:00:00.000Z",
    });
    const samples = createSampleWeek("2026-07-13");
    const result = mergeSampleWeek([real], samples);

    expect(result.status).toBe("conflict");
    expect(result.entries).toEqual([real]);
    if (result.status !== "conflict") throw new Error("Expected a conflict.");
    expect(result.conflictingDates).toEqual(["2026-07-13"]);
  });

  it("requires an explicit confirmation flag before replacing a conflict", () => {
    const real = createDailyEntry(profile, checkIn, "2026-07-13");
    const samples = createSampleWeek("2026-07-13");
    const result = mergeSampleWeek([real], samples, { confirmedRealOverwrite: true });

    expect(result.status).toBe("merged");
    if (result.status !== "merged") throw new Error("Expected a merge.");
    expect(result.replacedRealDates).toEqual(["2026-07-13"]);
    expect(result.entries).toHaveLength(7);
    expect(result.entries.every((entry) => entry.isSample)).toBe(true);
    expect(removeSampleEntries(result.entries)).toEqual([]);
  });
});
