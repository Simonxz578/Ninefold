import {
  PERSONALITY_CODES,
  derivePersonalityPreferences,
  isPersonalityPreferences,
  type EOrI,
  type JOrP,
  type SOrN,
  type TOrF,
} from "../index";

describe("V3 personality preference derivation", () => {
  it("makes all sixteen four-letter codes reachable", () => {
    const codes = new Set<string>();
    for (const eOrI of ["E", "I"] as const satisfies readonly EOrI[]) {
      for (const sOrN of ["S", "N"] as const satisfies readonly SOrN[]) {
        for (const tOrF of ["T", "F"] as const satisfies readonly TOrF[]) {
          for (const jOrP of ["J", "P"] as const satisfies readonly JOrP[]) {
            codes.add(derivePersonalityPreferences({ eOrI, sOrN, tOrF, jOrP }).code);
          }
        }
      }
    }
    expect([...codes].sort()).toEqual([...PERSONALITY_CODES].sort());
  });

  it("maps each answer directly to its matching dimension", () => {
    expect(derivePersonalityPreferences({ eOrI: "I", sOrN: "N", tOrF: "F", jOrP: "J" }))
      .toEqual({ eOrI: "I", sOrN: "N", tOrF: "F", jOrP: "J", code: "INFJ" });
    expect(derivePersonalityPreferences({ eOrI: "E", sOrN: "S", tOrF: "T", jOrP: "P" }).code)
      .toBe("ESTP");
  });

  it("rejects partial, invalid, and internally inconsistent stored values", () => {
    expect(isPersonalityPreferences({ eOrI: "I", sOrN: "N", tOrF: "F", jOrP: "J", code: "INFJ" })).toBe(true);
    expect(isPersonalityPreferences({ eOrI: "I", sOrN: "N", tOrF: "F", jOrP: "J", code: "ENTP" })).toBe(false);
    expect(isPersonalityPreferences({ eOrI: "I", sOrN: "N", tOrF: "F", code: "INFJ" })).toBe(false);
    expect(isPersonalityPreferences({ eOrI: "X", sOrN: "N", tOrF: "F", jOrP: "J", code: "XNFJ" })).toBe(false);
  });
});
