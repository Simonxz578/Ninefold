import { describe, expect, it } from "vitest";
import { buildMonth, CHINA_2026_ADJUSTED_WORKDAYS, CHINA_2026_HOLIDAYS } from "../calendar";

describe("V3.1 calendar data", () => {
  it("uses the official 2026 holiday and adjusted-workday dates", () => {
    expect(CHINA_2026_HOLIDAYS.has("2026-02-15")).toBe(true);
    expect(CHINA_2026_HOLIDAYS.has("2026-02-23")).toBe(true);
    expect(CHINA_2026_ADJUSTED_WORKDAYS.has("2026-02-14")).toBe(true);
    expect(CHINA_2026_ADJUSTED_WORKDAYS.has("2026-10-10")).toBe(true);
  });

  it("builds a stable six-week, seven-column month without timezone parsing", () => {
    const month = buildMonth(2026, 8);
    expect(month).toHaveLength(42);
    expect(month[0]?.date).toBe("2026-07-26");
    expect(month[41]?.date).toBe("2026-09-05");
  });

  it("labels traditional festivals but never exposes almanac advice", () => {
    const qixi = buildMonth(2026, 8).find((day) => day.date === "2026-08-19");
    expect(qixi?.labels).toContain("七夕节");
    expect(JSON.stringify(qixi)).not.toMatch(/宜|忌|吉|凶/);
  });
});
