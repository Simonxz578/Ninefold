import { formatDateForLocale, interpolate } from "..";

describe("locale formatters", () => {
  it("formats the same local date naturally in English and Chinese", () => {
    expect(formatDateForLocale("2026-07-14", "en")).toBe("Tuesday, 14 July 2026");
    expect(formatDateForLocale("2026-07-14", "zh-CN")).toBe("2026年7月14日 星期二");
  });

  it("keeps date-only inputs on the requested calendar day", () => {
    expect(formatDateForLocale("2026-01-02", "en", "monthDay")).toBe("2 January");
    expect(formatDateForLocale("2026-01-02", "zh-CN", "monthDay")).toBe("1月2日");
  });

  it("returns an empty value for an invalid date", () => {
    expect(formatDateForLocale("not-a-date", "en")).toBe("");
  });

  it("interpolates named product-copy values without evaluating them", () => {
    expect(interpolate("Welcome back, {name}.", { name: "Mina" })).toBe("Welcome back, Mina.");
    expect(interpolate("还剩 {time}", { time: "30 秒" })).toBe("还剩 30 秒");
  });
});

