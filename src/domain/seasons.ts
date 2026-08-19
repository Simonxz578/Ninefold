export const GROWTH_EVENTS_PER_SEASON = 28;

export interface SeasonVisualState {
  seasonIndex: number;
  progress: number;
  canopyDensity: number;
  backgroundFlowers: number;
  nebulaVisibility: number;
  waterReflection: number;
  grassMaturity: number;
  /** 0 favours cool sky tones; 1 favours warmer growth tones. */
  colourBalance: number;
}

const requireEventCount = (eventCount: number): void => {
  if (!Number.isInteger(eventCount) || eventCount < 0) {
    throw new RangeError("Growth event count must be a non-negative integer.");
  }
};

const roundUnit = (value: number): number =>
  Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;

export function getSeasonIndex(eventCount: number): number {
  requireEventCount(eventCount);
  return Math.floor(eventCount / GROWTH_EVENTS_PER_SEASON);
}

export function getSeasonProgress(eventCount: number): number {
  requireEventCount(eventCount);
  return roundUnit((eventCount % GROWTH_EVENTS_PER_SEASON) / GROWTH_EVENTS_PER_SEASON);
}

/**
 * A visual cycle only: no score, rank, decay or missed-day input participates.
 */
export function deriveSeasonVisualState(eventCount: number): SeasonVisualState {
  const seasonIndex = getSeasonIndex(eventCount);
  const progress = getSeasonProgress(eventCount);
  const phase = seasonIndex % 4;
  const phaseWarmth = [0.46, 0.68, 0.78, 0.38][phase] ?? 0.5;
  const matureBase = Math.min(0.72, eventCount / (GROWTH_EVENTS_PER_SEASON * 3));

  return {
    seasonIndex,
    progress,
    canopyDensity: roundUnit(0.18 + matureBase * 0.64 + progress * 0.12),
    backgroundFlowers: roundUnit((phase === 0 || phase === 1 ? 0.34 : 0.14) + progress * 0.42),
    nebulaVisibility: roundUnit(0.08 + matureBase * 0.62 + (phase === 3 ? 0.18 : 0)),
    waterReflection: roundUnit(0.36 + matureBase * 0.38 + (phase === 2 ? 0.12 : 0)),
    grassMaturity: roundUnit(0.2 + matureBase * 0.58 + progress * 0.14),
    colourBalance: roundUnit(phaseWarmth + (progress - 0.5) * 0.12),
  };
}
