import { en } from "./en";
import type { Locale, TranslationDictionary } from "./types";
import { zhCN } from "./zh-CN";

export const dictionaries: Readonly<Record<Locale, TranslationDictionary>> = {
  en,
  "zh-CN": zhCN,
};

