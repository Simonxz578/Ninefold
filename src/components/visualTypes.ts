import { COLOR_SYMBOLS } from "../domain/symbols";

export type PatternColour =
  | string
  | {
      name: string;
      hex: string;
    };

export interface PatternOpacityProfile {
  base: number;
  accent: number;
  line: number;
}

/**
 * A deliberately structural visual contract. It accepts both the domain
 * PatternConfiguration and the smaller hand-authored samples used in the UI.
 */
export interface VisualPatternInput {
  seed: string;
  pathNumber: number;
  dailyNumber: number;
  primaryColor: PatternColour;
  secondaryColor: PatternColour;
  form: string;
  rotation: number;
  layerCount: number;
  density: number;
  direction: string;
  symmetry: number | string;
  lineWeight: number;
  opacity?: number;
  opacityProfile?: Partial<PatternOpacityProfile>;
}

export interface WeeklyVisualEntry {
  id: string;
  date?: string;
  pattern: VisualPatternInput;
  visible?: boolean;
}

export function colourName(colour: PatternColour): string {
  if (typeof colour === "string") {
    return colour;
  }

  return colour.name;
}

export function colourHex(colour: PatternColour): string {
  if (typeof colour !== "string") {
    return colour.hex;
  }

  if (/^#[\da-f]{3,8}$/i.test(colour)) {
    return colour;
  }

  const matchingSymbol = Object.values(COLOR_SYMBOLS).find(
    (symbol) => symbol.name.toLowerCase() === colour.trim().toLowerCase(),
  );

  return matchingSymbol?.hex ?? COLOR_SYMBOLS.Indigo.hex;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
