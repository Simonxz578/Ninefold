import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { I18nContext } from "./context";
import { dictionaries } from "./dictionaries";
import { formatDateForLocale } from "./formatters";
import { readStoredLocale, storeLocale } from "./localeStorage";
import {
  languageFromLocale,
  localeFromPath,
  mapLocationToLocale,
  resolveLocale,
} from "./routing";
import type { DateFormatStyle, DateInput, Locale } from "./types";

interface I18nProviderProps {
  children: ReactNode;
}

function browserLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  if (navigator.languages.length > 0) return navigator.languages;
  return navigator.language ? [navigator.language] : [];
}

export function I18nProvider({ children }: I18nProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [fallbackLocale, setFallbackLocale] = useState<Locale>(() =>
    resolveLocale(location.pathname, readStoredLocale(), browserLanguages()),
  );
  const routeLocale = localeFromPath(location.pathname);
  const locale = routeLocale ?? fallbackLocale;

  useEffect(() => {
    setFallbackLocale(locale);
    storeLocale(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setFallbackLocale(nextLocale);
    storeLocale(nextLocale);
    const nextLocation = mapLocationToLocale(location, nextLocale);
    if (nextLocation.pathname === location.pathname) return;
    navigate(
      {
        pathname: nextLocation.pathname,
        search: nextLocation.search ?? location.search,
        hash: nextLocation.hash ?? location.hash,
      },
      { replace: true, state: nextLocation.state },
    );
  }, [location, navigate]);

  const formatDate = useCallback(
    (input: DateInput, style?: DateFormatStyle) => formatDateForLocale(input, locale, style),
    [locale],
  );

  const value = useMemo(() => ({
    locale,
    language: languageFromLocale(locale),
    t: dictionaries[locale],
    setLocale,
    formatDate,
  }), [formatDate, locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

