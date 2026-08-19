import { useContext } from "react";
import { I18nContext } from "./context";
import type { I18nValue } from "./types";

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used within an I18nProvider.");
  return value;
}

export const useTranslation = useI18n;

