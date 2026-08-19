import { createContext, useContext } from "react";
import type { Locale } from "../i18n";
import type { V3Copy } from "./copy";
import type {
  AmbientMode,
  BreathingDurationSeconds,
  DailyCheckInV3,
  DraftWorldIdentity,
  NinefoldV3State,
  PreferenceAnswersV3,
  RatingNine,
} from "./domain";

export type V3StorageErrorKind = "unavailable" | "corrupt" | "read" | "write";

export interface SaveDailyCheckInInput {
  mood: RatingNine;
  energy: RatingNine;
  localDate?: string;
  now?: string;
}

export interface CompleteDailySessionInput {
  sessionId: string;
  localDate?: string;
  durationSeconds: BreathingDurationSeconds;
  ambientMode: AmbientMode;
  startedAt: string;
  completedAt: string;
}

export interface CompleteDailySessionResult {
  added: boolean;
  state: NinefoldV3State | null;
}

export interface UpdateAudioPreferencesInput {
  preferredAmbientMode?: AmbientMode;
  audioMuted?: boolean;
  audioVolume?: number;
}

export interface V3AppContextValue {
  locale: Locale;
  copy: V3Copy;
  state: NinefoldV3State | null;
  draft: DraftWorldIdentity;
  todayKey: string;
  todayCheckIn: DailyCheckInV3 | null;
  newLeafIndex: number | null;
  hasStoredData: boolean;
  storageAvailable: boolean;
  storageError: V3StorageErrorKind | null;
  updateDraft: (patch: Partial<DraftWorldIdentity>) => boolean;
  completeBuilder: (personalityAnswers: PreferenceAnswersV3) => boolean;
  saveDailyCheckIn: (input: SaveDailyCheckInInput) => DailyCheckInV3 | null;
  completeDailySession: (input: CompleteDailySessionInput) => CompleteDailySessionResult;
  updatePreferences: (answers: PreferenceAnswersV3) => boolean;
  updateAudioPreferences: (input: UpdateAudioPreferencesInput) => boolean;
  clearNewLeaf: () => void;
  resetV3: () => boolean;
  refreshFromStorage: () => void;
}

export const V3AppContext = createContext<V3AppContextValue | null>(null);

export function useV3App(): V3AppContextValue {
  const value = useContext(V3AppContext);
  if (!value) throw new Error("useV3App must be used within Ninefold V3.");
  return value;
}
