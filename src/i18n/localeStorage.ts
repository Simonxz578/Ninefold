import type { Locale } from "./types";

export const LOCALE_STORAGE_KEY = "ninefold:v2:locale";

export function readStoredLocale(): Locale | null {
  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return value === "en" || value === "zh-CN" ? value : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Locale persistence is helpful but must never block the local experience.
  }
}

