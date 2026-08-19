import {
  CARE_ACTIONS,
  CARE_ACTION_GROWTH_FIELDS,
  GROWTH_METRICS,
  applyGrowthEvent,
  composeLivingLandscape,
  createDailyEntry,
  createGrowthEventFromDailyEntry,
  createLivingLandscape,
  deriveCareActionGrowth,
  deriveSeasonVisualState,
  deriveWeatherState,
  formatReflectionForLocale,
  getPathGrammar,
  getPathGrammarSignature,
  getSeasonIndex,
  getSeasonProgress,
  getTimeOfDay,
  listPathGrammars,
  migrateV1ToV2,
  recordLandscapeVisit,
  reframeDailyEntry,
} from "../index";
import type {
  CareAction,
  DailyCheckIn,
  GrowthEvent,
  Profile,
} from "../types";

const profile: Profile = {
  id: "living-world-profile",
  displayName: "Lin",
  pathNumber: 3,
  lenses: { approach: "exploratory", processing: "intuitive" },
  createdAt: "2026-07-01T08:00:00.000Z",
};

const checkIn: DailyCheckIn = {
  energy: 4,
  clarity: 2,
  connection: "outward",
  focus: "creativity",
  note: "This remains local.",
};

function growthEvent(date: string, careAction: CareAction = "nourish"): GrowthEvent {
  const entry = createDailyEntry(profile, checkIn, date, {
    now: `${date}T08:00:00.000Z`,
  });
  return createGrowthEventFromDailyEntry(entry, {
    careAction,
    localeAtCreation: "en",
    timeOfDay: "morning",
  });
}

describe("living-world weather", () => {
  it("is deterministic, normalised and grounded in the supplied broad time", () => {
    const first = deriveWeatherState(checkIn, "evening");
    const second = deriveWeatherState(checkIn, "evening");

    expect(second).toEqual(first);
    expect(first).toMatchObject({
      timeOfDay: "evening",
      motionBias: "outward",
      focusMotif: "creativity",
    });
    [
      first.skyClarity,
      first.cloudDensity,
      first.rainIntensity,
      first.windStrength,
      first.sunlight,
      first.starVisibility,
    ].forEach((value) => expect(value).toBeGreaterThanOrEqual(0));
    [
      first.skyClarity,
      first.cloudDensity,
      first.rainIntensity,
      first.windStrength,
      first.sunlight,
      first.starVisibility,
    ].forEach((value) => expect(value).toBeLessThanOrEqual(1));
  });

  it("maps higher energy and clarity without judging either state", () => {
    const quiet = deriveWeatherState(
      { ...checkIn, energy: 1, clarity: 1 },
      "day",
    );
    const open = deriveWeatherState(
      { ...checkIn, energy: 5, clarity: 5 },
      "day",
    );

    expect(open.windStrength).toBeGreaterThan(quiet.windStrength);
    expect(open.skyClarity).toBeGreaterThan(quiet.skyClarity);
    expect(open.cloudDensity).toBeLessThan(quiet.cloudDensity);
    expect(open.sunlight).toBeGreaterThan(quiet.sunlight);
  });

  it("derives only a broad time-of-day bucket", () => {
    expect([getTimeOfDay(5), getTimeOfDay(10), getTimeOfDay(17), getTimeOfDay(21)]).toEqual([
      "morning",
      "day",
      "evening",
      "night",
    ]);
    expect(() => getTimeOfDay(24)).toThrow(RangeError);
  });
});

describe("nine Path grammars", () => {
  it("provides nine structurally unique renderer-facing grammars", () => {
    const grammars = listPathGrammars();
    const signatures = grammars.map((grammar) => getPathGrammarSignature(grammar.pathNumber));

    expect(grammars).toHaveLength(9);
    expect(new Set(signatures).size).toBe(9);
    expect(grammars.map((grammar) => grammar.name.zh)).toEqual([
      "启程",
      "联结",
      "表达",
      "构筑",
      "流动",
      "养护",
      "沉思",
      "凝成",
      "归一",
    ]);
  });

  it("makes Expression and Movement different structures, not parameter variants", () => {
    const expression = getPathGrammar(3);
    const movement = getPathGrammar(5);

    expect(expression.silhouette).toBe("flowering-radiance");
    expect(movement.silhouette).toBe("wind-swept-flow");
    expect(expression.branchPattern).not.toBe(movement.branchPattern);
    expect(expression.rootPattern).not.toBe(movement.rootPattern);
    expect(expression.biome).not.toBe(movement.biome);
    expect(expression.growthFeatures).toContain("flower");
    expect(movement.growthFeatures).toContain("stream");
  });
});

describe("growth composition and continuity", () => {
  it("limits each care action to its explicitly permitted growth fields", () => {
    const pattern = growthEvent("2026-07-13").pattern;

    CARE_ACTIONS.forEach((careAction) => {
      const delta = deriveCareActionGrowth(careAction, pattern);
      const changed = GROWTH_METRICS.filter((metric) => delta[metric] > 0).sort();
      expect(changed).toEqual([...CARE_ACTION_GROWTH_FIELDS[careAction]].sort());
    });
  });

  it("creates a complete GrowthEvent without losing DailyEntry metadata", () => {
    const entry = createDailyEntry(profile, checkIn, "2026-07-13", {
      now: "2026-07-13T08:00:00.000Z",
    });
    const reframed = reframeDailyEntry(
      entry,
      profile,
      [],
      undefined,
      "2026-07-13T09:00:00.000Z",
    );
    if (!reframed.ok) throw new Error("Expected a Reframe fixture.");

    const event = createGrowthEventFromDailyEntry(reframed.entry, {
      careAction: "protect",
      localeAtCreation: "zh-CN",
      timeOfDay: "night",
    });

    expect(event).toMatchObject({
      date: entry.date,
      path: profile.pathNumber,
      careAction: "protect",
      careActionSource: "user",
      localeAtCreation: "zh-CN",
      activeVariant: "reframe",
      weather: { timeOfDay: "night" },
    });
    expect(event.pattern.seed).toBe(entry.original.configuration.seed);
    expect(event.reframe?.seed).toBe(reframed.entry.reframe?.configuration.seed);
    expect(event.reframeReflection).toEqual(reframed.entry.reframe?.reflection);
  });

  it("is deterministic and idempotent for one date", () => {
    const empty = createLivingLandscape(profile, "en");
    const event = growthEvent("2026-07-13", "nourish");
    const once = applyGrowthEvent(empty, event);
    const twice = applyGrowthEvent(once, event);

    expect(twice.events).toHaveLength(1);
    expect(composeLivingLandscape(twice)).toEqual(composeLivingLandscape(once));
    expect(composeLivingLandscape(once).traces[0]).toMatchObject({
      date: "2026-07-13",
      path: 3,
      careAction: "nourish",
    });
  });

  it("does not decay, delete or alter composition after an absence", () => {
    const landscape = applyGrowthEvent(
      createLivingLandscape(profile, "en"),
      growthEvent("2026-07-13", "observe"),
    );
    const before = composeLivingLandscape(landscape);
    const afterAbsence = recordLandscapeVisit(landscape, "2026-10-13T08:00:00.000Z");

    expect(afterAbsence.lastVisitedAt).not.toBe(landscape.lastVisitedAt);
    expect(afterAbsence.events).toEqual(landscape.events);
    expect(composeLivingLandscape(afterAbsence)).toEqual(before);
  });

  it("uses accumulated events—not missed calendar days—for visual seasons", () => {
    expect([getSeasonIndex(0), getSeasonIndex(27), getSeasonIndex(28), getSeasonIndex(56)]).toEqual([
      0,
      0,
      1,
      2,
    ]);
    expect(getSeasonProgress(28)).toBe(0);
    expect(deriveSeasonVisualState(28)).toMatchObject({ seasonIndex: 1, progress: 0 });
    expect(deriveSeasonVisualState(28).canopyDensity).toBeGreaterThan(
      deriveSeasonVisualState(0).canopyDensity,
    );
  });
});

describe("bilingual semantic reflection", () => {
  it("uses independently authored Chinese while preserving deterministic configuration", () => {
    const event = growthEvent("2026-07-13", "protect");
    const patternBefore = JSON.stringify(event.pattern);
    const english = formatReflectionForLocale(event, "en");
    const chinese = formatReflectionForLocale(event, "zh-CN");

    expect(formatReflectionForLocale(event, "zh-CN")).toEqual(chinese);
    expect(chinese).not.toEqual(english);
    expect(chinese.evidence[1]).toContain("心径「表达」");
    expect(chinese.evidence[1]).toContain(`数字 ${event.pattern.dailyNumber}`);
    expect(chinese.tension).toContain("今天需要的不是更快");
    expect(chinese.opportunity).toBe(
      "先守住那个尚未成形的念头，不必急着让它今天就有答案。",
    );
    expect(chinese.disclaimer).toContain("并非诊断、心理咨询或占卜服务");
    expect(english.evidence[1]).toContain(`daily number ${event.pattern.dailyNumber}`);
    expect(JSON.stringify(event.pattern)).toBe(patternBefore);
  });

  it("also accepts the preserved DailyEntry schema without changing its seed", () => {
    const entry = createDailyEntry(profile, checkIn, "2026-07-14");
    const seed = entry.original.configuration.seed;

    expect(formatReflectionForLocale(entry, "zh-CN").evidence[1]).toContain("心径「表达」");
    expect(entry.original.configuration.seed).toBe(seed);
  });
});

describe("safe V1 to V2 migration", () => {
  it("preserves profile, dates, feedback, sample state and Reframe relationships", () => {
    const original = createDailyEntry(profile, checkIn, "2026-07-13", {
      now: "2026-07-13T08:00:00.000Z",
    });
    const reframed = reframeDailyEntry(
      original,
      profile,
      [],
      undefined,
      "2026-07-13T09:00:00.000Z",
    );
    if (!reframed.ok) throw new Error("Expected a Reframe fixture.");
    const source = {
      profile,
      checkIns: { [original.date]: checkIn },
      entries: [reframed.entry],
      feedback: [
        { date: original.date, choice: "useful", recordedAt: "2026-07-13T09:05:00.000Z" },
      ],
      sampleWeek: { loaded: true, dates: [original.date], loadedAt: "2026-07-13T09:06:00.000Z" },
      locale: "zh-CN",
      migratedAt: "2026-07-13T10:00:00.000Z",
    } as const;
    const sourceBefore = JSON.stringify(source);

    const first = migrateV1ToV2(source);
    const second = migrateV1ToV2(source, first.landscape ?? undefined);
    const event = first.landscape?.events[0];

    expect(first.profile).toEqual(profile);
    expect(first.preservedCheckIns[original.date]).toEqual(checkIn);
    expect(first.preservedFeedback).toEqual(source.feedback);
    expect(first.landscape).toMatchObject({
      profileId: profile.id,
      path: profile.pathNumber,
      currentLocale: "zh-CN",
      sampleWeek: source.sampleWeek,
    });
    expect(event).toMatchObject({
      date: original.date,
      careAction: "observe",
      careActionSource: "migrated-default",
      activeVariant: "reframe",
      feedback: "useful",
    });
    expect(event?.pattern.seed).toBe(original.original.configuration.seed);
    expect(event?.reframe?.seed).toBe(reframed.entry.reframe?.configuration.seed);
    expect(event?.reframeReflection).toEqual(reframed.entry.reframe?.reflection);
    expect(second.landscape).toEqual(first.landscape);
    expect(second.marker).toEqual(first.marker);
    expect(JSON.stringify(source)).toBe(sourceBefore);
  });

  it("skips corrupted records safely and reports recovery details", () => {
    const valid = createDailyEntry(profile, checkIn, "2026-07-13");
    const result = migrateV1ToV2({
      profile: { unsafe: true },
      entries: [{ invalid: true }, valid],
      checkIns: { "not-a-date": checkIn, [valid.date]: checkIn },
      feedback: [{ unsafe: true }],
      sampleWeek: { loaded: true, dates: ["not-a-date"] },
    });

    expect(result.landscape?.events).toHaveLength(1);
    expect(result.skippedEntryCount).toBe(1);
    expect(result.profile).toEqual(valid.profileSnapshot);
    expect(result.issues.map((issue) => issue.kind)).toEqual(
      expect.arrayContaining([
        "invalid-profile",
        "profile-recovered",
        "invalid-entry",
        "invalid-check-in",
        "invalid-feedback",
        "invalid-sample-week",
      ]),
    );
  });
});
