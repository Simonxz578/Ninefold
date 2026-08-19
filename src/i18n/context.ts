import { createContext } from "react";
import type { I18nValue } from "./types";

export const I18nContext = createContext<I18nValue | null>(null);

