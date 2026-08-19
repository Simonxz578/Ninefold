export { dictionaries } from "./dictionaries";
export { en } from "./en";
export { formatDateForLocale, interpolate } from "./formatters";
export { I18nProvider } from "./I18nProvider";
export { LOCALE_STORAGE_KEY, readStoredLocale, storeLocale } from "./localeStorage";
export {
  languageFromLocale,
  localeFromPath,
  localizedPath,
  mapLocationToLocale,
  resolveLocale,
  stripLocale,
  suggestLocale,
} from "./routing";
export type { LocaleLocation } from "./routing";
export type {
  CareAction,
  CareActionTranslation,
  DateFormatStyle,
  DateInput,
  FormatDate,
  I18nValue,
  Language,
  Locale,
  PathNumber,
  PathTranslation,
  TranslationDictionary,
} from "./types";
export { SUPPORTED_LOCALES } from "./types";
export { useI18n, useTranslation } from "./useTranslation";
export { zhCN } from "./zh-CN";

