import {
  localeFromPath,
  localizedPath,
  mapLocationToLocale,
  resolveLocale,
  stripLocale,
  suggestLocale,
} from "..";

describe("locale routing", () => {
  it("reads and strips supported route locale segments", () => {
    expect(localeFromPath("/en/today")).toBe("en");
    expect(localeFromPath("/zh/archive")).toBe("zh-CN");
    expect(localeFromPath("/today")).toBeNull();
    expect(stripLocale("/zh/today")).toBe("/today");
    expect(stripLocale("/en/")).toBe("/");
  });

  it("maps locale while preserving route, query and fragment", () => {
    expect(localizedPath("/en/today?stage=reflect#details", "zh-CN"))
      .toBe("/zh/today?stage=reflect#details");
    expect(localizedPath("/archive?sample=1", "en")).toBe("/en/archive?sample=1");
    expect(localizedPath("/zh/", "en")).toBe("/en/");
  });

  it("preserves the exact router state object during a locale switch", () => {
    const experienceState = {
      stage: "tend",
      attune: { energy: 4, clarity: 2, connection: "inward" },
      careAction: "protect",
      restMode: true,
      openPanel: "today-shape",
    } as const;
    const current = {
      pathname: "/en/today",
      search: "?view=alternate",
      hash: "#reflection",
      state: experienceState,
      key: "daily-view",
    };
    const next = mapLocationToLocale(current, "zh-CN");

    expect(next).toEqual({ ...current, pathname: "/zh/today" });
    expect(next.state).toBe(experienceState);
  });

  it("uses route, then stored choice, then browser suggestion", () => {
    expect(resolveLocale("/zh/today", "en", ["en-US"])).toBe("zh-CN");
    expect(resolveLocale("/today", "zh-CN", ["en-US"])).toBe("zh-CN");
    expect(resolveLocale("/today", null, ["zh-Hans-CN", "en-US"])).toBe("zh-CN");
    expect(resolveLocale("/today", "invalid", ["fr-FR"])).toBe("en");
    expect(suggestLocale([])).toBe("en");
  });
});

