import type { Language, Locale } from "./types";

const routeLanguageByLocale: Record<Locale, Language> = {
  en: "en",
  "zh-CN": "zh",
};

const localeByRouteLanguage: Record<Language, Locale> = {
  en: "en",
  zh: "zh-CN",
};

function splitPathSuffix(value: string): { path: string; suffix: string } {
  const queryIndex = value.indexOf("?");
  const hashIndex = value.indexOf("#");
  const candidates = [queryIndex, hashIndex].filter((index) => index >= 0);
  const suffixIndex = candidates.length > 0 ? Math.min(...candidates) : -1;
  if (suffixIndex < 0) return { path: value, suffix: "" };
  return { path: value.slice(0, suffixIndex), suffix: value.slice(suffixIndex) };
}

function normalisePathname(pathname: string): string {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, "/");
  return collapsed || "/";
}

export function languageFromLocale(locale: Locale): Language {
  return routeLanguageByLocale[locale];
}

export function localeFromPath(pathname: string): Locale | null {
  const { path } = splitPathSuffix(normalisePathname(pathname));
  const match = /^\/(en|zh)(?:\/|$)/.exec(path);
  return match ? localeByRouteLanguage[match[1] as Language] : null;
}

export function stripLocale(pathname: string): string {
  const { path, suffix } = splitPathSuffix(normalisePathname(pathname));
  const stripped = path.replace(/^\/(?:en|zh)(?=\/|$)/, "") || "/";
  const normalised = stripped.startsWith("/") ? stripped : `/${stripped}`;
  return `${normalised}${suffix}`;
}

export function localizedPath(pathname: string, locale: Locale): string {
  const { path, suffix } = splitPathSuffix(stripLocale(pathname));
  const language = languageFromLocale(locale);
  const localized = path === "/" ? `/${language}/` : `/${language}${path}`;
  return `${localized}${suffix}`;
}

export interface LocaleLocation<State = unknown> {
  pathname: string;
  search?: string;
  hash?: string;
  state?: State;
  key?: string;
}

export function mapLocationToLocale<State>(
  location: LocaleLocation<State>,
  locale: Locale,
): LocaleLocation<State> {
  return {
    ...location,
    pathname: localizedPath(location.pathname, locale),
  };
}

export function suggestLocale(browserLanguages: readonly string[] = []): Locale {
  const normalised = browserLanguages.map((language) => language.toLowerCase());
  return normalised.some((language) => language === "zh" || language.startsWith("zh-"))
    ? "zh-CN"
    : "en";
}

export function resolveLocale(
  pathname: string,
  persistedLocale: string | null,
  browserLanguages: readonly string[] = [],
): Locale {
  const routeLocale = localeFromPath(pathname);
  if (routeLocale) return routeLocale;
  if (persistedLocale === "en" || persistedLocale === "zh-CN") return persistedLocale;
  return suggestLocale(browserLanguages);
}

