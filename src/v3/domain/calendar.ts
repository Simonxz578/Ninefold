import { Solar } from "lunar-javascript";

export interface CalendarDayInfo {
  date: string;
  day: number;
  inMonth: boolean;
  lunarLabel: string;
  labels: readonly string[];
  official: "holiday" | "workday" | null;
}

// 国办发明电〔2025〕7号, published 2025-11-04 by the State Council General Office.
export const CHINA_2026_HOLIDAYS = new Set([
  "2026-01-01","2026-01-02","2026-01-03",
  "2026-02-15","2026-02-16","2026-02-17","2026-02-18","2026-02-19","2026-02-20","2026-02-21","2026-02-22","2026-02-23",
  "2026-04-04","2026-04-05","2026-04-06",
  "2026-05-01","2026-05-02","2026-05-03","2026-05-04","2026-05-05",
  "2026-06-19","2026-06-20","2026-06-21",
  "2026-09-25","2026-09-26","2026-09-27",
  "2026-10-01","2026-10-02","2026-10-03","2026-10-04","2026-10-05","2026-10-06","2026-10-07",
]);
export const CHINA_2026_ADJUSTED_WORKDAYS = new Set(["2026-01-04","2026-02-14","2026-02-28","2026-05-09","2026-09-20","2026-10-10"]);

const OBSERVANCES: Record<string, string> = {
  "01-01":"元旦", "02-14":"情人节", "03-08":"妇女节", "05-01":"劳动节", "10-31":"万圣夜", "12-25":"圣诞节",
  "2026-04-05":"复活节", "2026-05-10":"母亲节", "2026-06-21":"父亲节",
};
const TRADITIONAL = new Set(["春节","元宵节","清明节","端午节","七夕节","中秋节","重阳节","冬至"]);

export function buildMonth(year: number, month: number): CalendarDayInfo[] {
  const first = new Date(year, month - 1, 1);
  const start = new Date(year, month - 1, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const value = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    const y = value.getFullYear(), m = value.getMonth() + 1, day = value.getDate();
    const date = `${y}-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const solar = Solar.fromYmd(y, m, day); const lunar = solar.getLunar();
    const festivals = [...solar.getFestivals(), ...lunar.getFestivals()].filter((name) => TRADITIONAL.has(name));
    const jieQi = lunar.getJieQi(); if (jieQi === "清明" || jieQi === "冬至") festivals.push(`${jieQi}节`);
    const observance = OBSERVANCES[date] ?? OBSERVANCES[date.slice(5)];
    const labels = [...new Set([...festivals, ...(observance ? [observance] : [])])];
    return { date, day, inMonth: m === month, lunarLabel: labels[0] ?? (lunar.getDayInChinese() === "初一" ? `${lunar.getMonthInChinese()}月` : lunar.getDayInChinese()), labels, official: CHINA_2026_HOLIDAYS.has(date) ? "holiday" : CHINA_2026_ADJUSTED_WORKDAYS.has(date) ? "workday" : null };
  });
}
