import type { DateFormatStyle, DateInput, Locale } from "./types";

const intlLocales: Record<Locale, string> = {
  en: "en-GB",
  "zh-CN": "zh-CN",
};

function toLocalDate(input: DateInput): Date {
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input === "string") {
    const localDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
    if (localDateMatch) {
      const [, year, month, day] = localDateMatch;
      return new Date(Number(year), Number(month) - 1, Number(day), 12);
    }
  }
  return new Date(input);
}

function dateOptions(style: Exclude<DateFormatStyle, "long">): Intl.DateTimeFormatOptions {
  const options: Record<Exclude<DateFormatStyle, "long">, Intl.DateTimeFormatOptions> = {
    short: { year: "numeric", month: "short", day: "numeric" },
    monthDay: { month: "long", day: "numeric" },
    weekday: { weekday: "long" },
    numeric: { year: "numeric", month: "numeric", day: "numeric" },
  };
  return options[style];
}

export function formatDateForLocale(
  input: DateInput,
  locale: Locale,
  style: DateFormatStyle = "long",
): string {
  const date = toLocalDate(input);
  if (Number.isNaN(date.getTime())) return "";

  if (style === "long" && locale === "zh-CN") {
    const calendarDate = new Intl.DateTimeFormat(intlLocales[locale], {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
    const weekday = new Intl.DateTimeFormat(intlLocales[locale], {
      weekday: "long",
    }).format(date);
    return `${calendarDate} ${weekday}`;
  }

  const options: Intl.DateTimeFormatOptions = style === "long"
    ? { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    : dateOptions(style);
  return new Intl.DateTimeFormat(intlLocales[locale], options).format(date);
}

export function interpolate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

