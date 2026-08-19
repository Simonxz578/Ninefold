declare module "lunar-javascript" {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): { getMonthInChinese(): string; getDayInChinese(): string; getJieQi(): string; getFestivals(): string[] };
    getFestivals(): string[];
  }
}
