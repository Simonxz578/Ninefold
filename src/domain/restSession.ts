export type GrowthStage = 0 | 1 | 2 | 3 | 4 | 5;

export type RestSessionDuration = 30 | 60 | 300;

export interface RestSessionProgress {
  completedSessions: number;
  totalCompletedSeconds: number;
  growthStage: GrowthStage;
  audioMuted: boolean;
  audioVolume: number;
  lastCompletedAt?: string;
}

export const DEFAULT_REST_SESSION_PROGRESS: Readonly<RestSessionProgress> = {
  completedSessions: 0,
  totalCompletedSeconds: 0,
  growthStage: 0,
  audioMuted: false,
  audioVolume: 0.3,
};

const GROWTH_STAGES: readonly GrowthStage[] = [0, 1, 2, 3, 4, 5];
const REST_SESSION_DURATIONS: readonly RestSessionDuration[] = [30, 60, 300];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const isUnitInterval = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

export function isRestSessionProgress(value: unknown): value is RestSessionProgress {
  if (!isRecord(value)) return false;
  return (
    isNonNegativeInteger(value.completedSessions) &&
    isNonNegativeInteger(value.totalCompletedSeconds) &&
    GROWTH_STAGES.some((stage) => stage === value.growthStage) &&
    typeof value.audioMuted === "boolean" &&
    isUnitInterval(value.audioVolume) &&
    (value.lastCompletedAt === undefined || typeof value.lastCompletedAt === "string")
  );
}

/**
 * Records exactly one completed timed Rest session. Open-ended sessions do not
 * advance persistent progress because they do not have a deterministic end.
 */
export function advanceRestSession(
  progress: RestSessionProgress,
  durationSeconds: RestSessionDuration,
  completedAt?: string,
): RestSessionProgress {
  if (!isRestSessionProgress(progress)) {
    throw new TypeError("Rest-session progress is invalid.");
  }
  if (!REST_SESSION_DURATIONS.some((duration) => duration === durationSeconds)) {
    throw new RangeError("Rest-session duration must be 30, 60, or 300 seconds.");
  }
  if (completedAt !== undefined && typeof completedAt !== "string") {
    throw new TypeError("Rest-session completion time must be a string.");
  }

  return {
    ...progress,
    completedSessions: progress.completedSessions + 1,
    totalCompletedSeconds: progress.totalCompletedSeconds + durationSeconds,
    growthStage: Math.min(5, progress.growthStage + 1) as GrowthStage,
    ...(completedAt === undefined ? {} : { lastCompletedAt: completedAt }),
  };
}

export interface RestAudioPreferenceUpdate {
  audioMuted?: boolean;
  audioVolume?: number;
}

export function updateRestAudioPreferences(
  progress: RestSessionProgress,
  preferences: RestAudioPreferenceUpdate,
): RestSessionProgress {
  if (!isRestSessionProgress(progress)) {
    throw new TypeError("Rest-session progress is invalid.");
  }
  if (preferences.audioMuted !== undefined && typeof preferences.audioMuted !== "boolean") {
    throw new TypeError("The Rest audio muted preference must be a boolean.");
  }
  if (preferences.audioVolume !== undefined && !isUnitInterval(preferences.audioVolume)) {
    throw new RangeError("Rest audio volume must be between 0 and 1.");
  }

  return {
    ...progress,
    ...(preferences.audioMuted === undefined ? {} : { audioMuted: preferences.audioMuted }),
    ...(preferences.audioVolume === undefined ? {} : { audioVolume: preferences.audioVolume }),
  };
}
