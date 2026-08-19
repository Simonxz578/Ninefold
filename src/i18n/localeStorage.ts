import { ninefoldV3Storage } from "../v3/domain";
import type { Locale } from "./types";

export const LOCALE_STORAGE_KEY = "ninefold:v3:locale";

export function readStoredLocale(): Locale | null {
  return ninefoldV3Storage.readLocale();
}

export function storeLocale(locale: Locale): void {
  ninefoldV3Storage.saveLocale(locale);
}
