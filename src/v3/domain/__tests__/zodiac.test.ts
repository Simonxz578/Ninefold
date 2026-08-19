import { deriveZodiacSign, isValidBirthDate, type ZodiacSignV3 } from "../index";

describe("V3 zodiac derivation", () => {
  const ranges: ReadonlyArray<{
    sign: ZodiacSignV3;
    start: readonly [number, number];
    end: readonly [number, number];
  }> = [
    { sign: "aries", start: [3, 21], end: [4, 19] },
    { sign: "taurus", start: [4, 20], end: [5, 20] },
    { sign: "gemini", start: [5, 21], end: [6, 20] },
    { sign: "cancer", start: [6, 21], end: [7, 22] },
    { sign: "leo", start: [7, 23], end: [8, 22] },
    { sign: "virgo", start: [8, 23], end: [9, 22] },
    { sign: "libra", start: [9, 23], end: [10, 22] },
    { sign: "scorpio", start: [10, 23], end: [11, 21] },
    { sign: "sagittarius", start: [11, 22], end: [12, 21] },
    { sign: "capricorn", start: [12, 22], end: [1, 19] },
    { sign: "aquarius", start: [1, 20], end: [2, 18] },
    { sign: "pisces", start: [2, 19], end: [3, 20] },
  ];

  it.each(ranges)("includes both fixed boundaries for $sign", ({ sign, start, end }) => {
    expect(deriveZodiacSign(...start)).toBe(sign);
    expect(deriveZodiacSign(...end)).toBe(sign);
  });

  it("accepts Feb 29 and assigns it to Pisces", () => {
    expect(isValidBirthDate(2, 29)).toBe(true);
    expect(deriveZodiacSign(2, 29)).toBe("pisces");
  });

  it.each([
    [0, 1], [13, 1], [1, 0], [1, 32], [2, 30], [4, 31], [6, 31], [9, 31], [11, 31],
    [1.5, 10], [3, 2.5],
  ])("rejects invalid month/day %s/%s", (month, day) => {
    expect(isValidBirthDate(month, day)).toBe(false);
    expect(() => deriveZodiacSign(month, day)).toThrow(RangeError);
  });
});
