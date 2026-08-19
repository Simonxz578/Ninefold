import {
  buildReflectionInput,
  createDailyEntry,
  generateOriginalConfiguration,
  generateReframeConfiguration,
  isReflectionOutput,
  LocalReflectionProvider,
  reframeDailyEntry,
  shiftLocalDate,
  validatePatternRanges,
} from "../index";
import type { DailyCheckIn, Profile } from "../types";

const profile: Profile = {
  id: "profile-determinism-test",
  displayName: "Ari",
  pathNumber: 7,
  lenses: { approach: "structured", processing: "analytical" },
  createdAt: "2026-07-01T08:00:00.000Z",
};

const checkIn: DailyCheckIn = {
  energy: 3,
  clarity: 4,
  connection: "inward",
  focus: "work",
  note: "This private note is not a generation seed.",
};

describe("deterministic generation", () => {
  it("produces the same original pattern for the same profile and local date", () => {
    const first = generateOriginalConfiguration(profile, checkIn, "2026-07-13");
    const second = generateOriginalConfiguration(profile, checkIn, "2026-07-13");

    expect(second).toEqual(first);
  });

  it("normally changes the pattern when the date changes", () => {
    const first = generateOriginalConfiguration(profile, checkIn, "2026-07-13");
    const second = generateOriginalConfiguration(profile, checkIn, "2026-07-14");

    expect({
      number: second.dailyNumber,
      primary: second.primaryColor,
      secondary: second.secondaryColor,
      form: second.form,
      rotation: second.rotation,
      direction: second.direction,
    }).not.toEqual({
      number: first.dailyNumber,
      primary: first.primaryColor,
      secondary: first.secondaryColor,
      form: first.form,
      rotation: first.rotation,
      direction: first.direction,
    });
  });

  it("keeps all generated values inside their documented ranges", () => {
    for (let offset = 0; offset < 120; offset += 1) {
      const date = shiftLocalDate("2026-01-01", offset);
      const configuration = generateOriginalConfiguration(profile, checkIn, date);
      expect(validatePatternRanges(configuration), date).toEqual({ valid: true, errors: [] });
      expect(configuration.primaryColor).not.toBe(configuration.secondaryColor);
    }
  });

  it("keeps score output responsive to the check-in", () => {
    const low = generateOriginalConfiguration(
      profile,
      { ...checkIn, energy: 1, clarity: 1 },
      "2026-07-13",
    );
    const high = generateOriginalConfiguration(
      profile,
      { ...checkIn, energy: 5, clarity: 5 },
      "2026-07-13",
    );

    expect(high.scores.clarity).toBeGreaterThan(low.scores.clarity);
    expect(high.scores.momentum).toBeGreaterThan(low.scores.momentum);
    expect(high.scores.tension).toBeLessThan(low.scores.tension);
  });
});

describe("daily Reframe", () => {
  it("preserves meaning foundations while deterministically changing permitted visual fields", () => {
    const original = generateOriginalConfiguration(profile, checkIn, "2026-07-13");
    const first = generateReframeConfiguration(original, profile, checkIn);
    const second = generateReframeConfiguration(original, profile, checkIn);

    expect(first).toEqual(second);
    expect(first.variant).toBe("reframe");
    expect(first.dailyNumber).toBe(original.dailyNumber);
    expect(first.scores).toEqual(original.scores);
    expect(first.pathNumber).toBe(original.pathNumber);
    expect(first.date).toBe(original.date);
    expect(first.primaryColor).not.toBe(original.primaryColor);
    expect(first.form).not.toBe(original.form);
  });

  it("allows only one Reframe on a daily entry", () => {
    const entry = createDailyEntry(profile, checkIn, "2026-07-13", {
      now: "2026-07-13T09:00:00.000Z",
    });
    const first = reframeDailyEntry(
      entry,
      profile,
      [],
      undefined,
      "2026-07-13T10:00:00.000Z",
    );
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error("Expected first Reframe to succeed.");

    const second = reframeDailyEntry(first.entry, profile);
    expect(second).toMatchObject({ ok: false, reason: "already-used" });
    expect(first.entry.reframe?.configuration.dailyNumber).toBe(
      first.entry.original.configuration.dailyNumber,
    );
  });

  it("keeps the original profile lenses when the profile is edited before Reframe", () => {
    const entry = createDailyEntry(profile, checkIn, "2026-07-13", {
      now: "2026-07-13T09:00:00.000Z",
    });
    const editedProfile: Profile = {
      ...profile,
      pathNumber: 2,
      zodiacSign: "leo",
      lenses: { approach: "exploratory", processing: "intuitive" },
    };
    const fromEditedProfile = reframeDailyEntry(
      entry,
      editedProfile,
      [],
      undefined,
      "2026-07-13T10:00:00.000Z",
    );
    const fromOriginalProfile = reframeDailyEntry(
      entry,
      profile,
      [],
      undefined,
      "2026-07-13T10:00:00.000Z",
    );

    expect(fromEditedProfile).toEqual(fromOriginalProfile);
    expect(fromEditedProfile.ok).toBe(true);
    if (!fromEditedProfile.ok) throw new Error("Expected Reframe to use the saved profile snapshot.");
    expect(fromEditedProfile.entry.reframe?.configuration.pathNumber).toBe(profile.pathNumber);
  });
});

describe("LocalReflectionProvider", () => {
  it("returns the required schema, actual symbols and deterministic language", () => {
    const configuration = generateOriginalConfiguration(profile, checkIn, "2026-07-13");
    const input = buildReflectionInput(profile, checkIn, configuration);
    const provider = new LocalReflectionProvider();
    const first = provider.reflect(input);
    const second = provider.reflect(input);

    expect(first).toEqual(second);
    expect(isReflectionOutput(first)).toBe(true);
    expect(first.evidence).toHaveLength(2);
    expect(first.evidence.join(" ")).toContain(`Path ${profile.pathNumber}`);
    expect(first.evidence.join(" ")).toContain(configuration.primaryColor);
    expect(first.evidence.join(" ")).toContain(configuration.form);
    expect(first.evidence.join(" ")).toContain(`Energy ${checkIn.energy}/5`);
    expect(first.action.length).toBeGreaterThan(20);
    expect(first.disclaimer).toContain("not a diagnostic");
  });
});
