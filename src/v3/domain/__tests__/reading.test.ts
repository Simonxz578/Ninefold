import {
  createDailyReadingSemantics,
  deriveDailyStateCell,
  derivePersonalityPreferences,
  deriveStateBand,
  isDailyReadingSemantics,
  type DailyStateCell,
} from "../index";

const personality = derivePersonalityPreferences({
  eOrI: "I",
  sOrN: "N",
  tOrF: "F",
  jOrP: "J",
});

const baseInput = {
  localDate: "2026-08-19",
  stableSeed: "profile-seed-九境",
  zodiacSign: "virgo" as const,
  personality,
  mood: 2 as const,
  energy: 6 as const,
};

describe("V3 daily state and semantic reading", () => {
  it("uses the exact 1–3, 4–6, and 7–9 bands", () => {
    expect([1, 2, 3].map((value) => deriveStateBand(value as 1 | 2 | 3))).toEqual(["low", "low", "low"]);
    expect([4, 5, 6].map((value) => deriveStateBand(value as 4 | 5 | 6))).toEqual(["mid", "mid", "mid"]);
    expect([7, 8, 9].map((value) => deriveStateBand(value as 7 | 8 | 9))).toEqual(["high", "high", "high"]);
    expect(() => deriveStateBand(0 as 1)).toThrow(RangeError);
    expect(() => deriveStateBand(10 as 9)).toThrow(RangeError);
  });

  it("makes all nine mood/energy cells reachable", () => {
    const cells = new Set<DailyStateCell>();
    for (const mood of [1, 5, 9] as const) {
      for (const energy of [1, 5, 9] as const) cells.add(deriveDailyStateCell(mood, energy));
    }
    expect([...cells].sort()).toEqual([
      "high-high", "high-low", "high-mid",
      "low-high", "low-low", "low-mid",
      "mid-high", "mid-low", "mid-mid",
    ]);
  });

  it("returns stable locale-neutral IDs for the same semantic inputs", () => {
    const first = createDailyReadingSemantics(baseInput);
    const reload = createDailyReadingSemantics({ ...baseInput });
    const sameCell = createDailyReadingSemantics({ ...baseInput, mood: 3, energy: 4 });

    expect(reload).toEqual(first);
    expect(sameCell).toEqual(first);
    expect(first.favourIds).toHaveLength(3);
    expect(new Set(first.favourIds)).toHaveLength(3);
    expect(first.easeOffIds).toHaveLength(2);
    expect(new Set(first.easeOffIds)).toHaveLength(2);
    expect(Object.values(first).some((value) => typeof value === "string" && /[\u3400-\u9fff]/u.test(value))).toBe(false);
    expect(isDailyReadingSemantics(first)).toBe(true);
  });

  it("anchors semantics to date, stable seed, zodiac, personality, and state cell", () => {
    const original = createDailyReadingSemantics(baseInput);
    expect(createDailyReadingSemantics({ ...baseInput, localDate: "2026-08-20" })).not.toEqual(original);
    expect(createDailyReadingSemantics({ ...baseInput, stableSeed: "another-profile" })).not.toEqual(original);
    expect(createDailyReadingSemantics({ ...baseInput, zodiacSign: "libra" })).not.toEqual(original);
    expect(createDailyReadingSemantics({
      ...baseInput,
      personality: derivePersonalityPreferences({ eOrI: "E", sOrN: "S", tOrF: "T", jOrP: "P" }),
    })).not.toEqual(original);
    expect(createDailyReadingSemantics({ ...baseInput, mood: 9, energy: 9 })).not.toEqual(original);
  });

  it("rejects corrupt semantic IDs", () => {
    const valid = createDailyReadingSemantics(baseInput);
    expect(isDailyReadingSemantics({ ...valid, keywordId: "translated-keyword" })).toBe(false);
    expect(isDailyReadingSemantics({ ...valid, favourIds: [valid.favourIds[0], valid.favourIds[0], valid.favourIds[1]] })).toBe(false);
    expect(isDailyReadingSemantics({ ...valid, adviceId: "official-diagnosis" })).toBe(false);
  });
});
