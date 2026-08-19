/* eslint-disable react-refresh/only-export-components -- Pages import the colocated V3 context hook. */
import {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PATH_NUMBERS } from "../domain";
import { I18nProvider, localizedPath, useI18n } from "../i18n";
import { localDateKey } from "../utils/date";
import { getV3Copy } from "./copy";
import {
  AMBIENT_MODES,
  CLOUD_ARCHETYPES,
  EMPTY_MEDITATION_PROGRESS_V3,
  V3_LEAF_LAYOUT_VERSION,
  V3_SCHEMA_VERSION,
  createDailyReadingSemantics,
  derivePersonalityPreferences,
  deriveZodiacSign,
  isDraftWorldIdentity,
  isPreferenceAnswers,
  isRatingNine,
  isValidBirthDate,
  ninefoldV3Storage,
  recordCompletedSession,
  type DraftWorldIdentity,
  type CloudArchetype,
  type NinefoldV3State,
  type V3StorageDiagnostic,
  type V3StorageWriteResult,
} from "./domain";
import { V3AppContext, type V3AppContextValue, type V3StorageErrorKind } from "./V3AppContext";
import { AboutPage } from "./pages/AboutPage";
import { GrowthPage } from "./pages/GrowthPage";
import { PreferencesPage } from "./pages/PreferencesPage";
import { TodayPage } from "./pages/TodayPage";
import { WorldBuilderPage } from "./pages/WorldBuilderPage";
import { WorldPage } from "./pages/WorldPage";

export { useV3App } from "./V3AppContext";
export type {
  CompleteDailySessionInput,
  CompleteDailySessionResult,
  SaveDailyCheckInInput,
  UpdateAudioPreferencesInput,
  V3AppContextValue,
  V3StorageErrorKind,
} from "./V3AppContext";

interface ControllerSnapshot {
  state: NinefoldV3State | null;
  draft: DraftWorldIdentity;
  storageAvailable: boolean;
  storageError: V3StorageErrorKind | null;
  hasStoredData: boolean;
}

let localIdSequence = 0;

export function V3App() {
  return (
    <V3ControllerProvider>
      <V3Routes />
    </V3ControllerProvider>
  );
}

export function NinefoldV3Root() {
  return (
    <I18nProvider>
      <V3App />
    </I18nProvider>
  );
}

function V3ControllerProvider({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const [initial] = useState(readInitialSnapshot);
  const [state, setState] = useState<NinefoldV3State | null>(initial.state);
  const [draft, setDraft] = useState<DraftWorldIdentity>(initial.draft);
  const [todayKey, setTodayKey] = useState(localDateKey);
  const [newLeafIndex, setNewLeafIndex] = useState<number | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(initial.storageAvailable);
  const [storageError, setStorageError] = useState<V3StorageErrorKind | null>(initial.storageError);
  const [hasStoredData, setHasStoredData] = useState(initial.hasStoredData);
  const stateRef = useRef(state);
  const draftRef = useRef(draft);
  const newLeafTimerRef = useRef<number | null>(null);
  const copy = getV3Copy(locale);

  const replaceState = useCallback((next: NinefoldV3State | null) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const replaceDraft = useCallback((next: DraftWorldIdentity) => {
    draftRef.current = next;
    setDraft(next);
  }, []);

  const noteWrite = useCallback((result: V3StorageWriteResult) => {
    const available = ninefoldV3Storage.isAvailable();
    setStorageAvailable(available);
    setHasStoredData(ninefoldV3Storage.hasAnyData());
    if (!result.ok) {
      setStorageError(available ? "write" : "unavailable");
    } else {
      setStorageError((current) => current === "write" || current === "unavailable" ? null : current);
    }
  }, []);

  const persistState = useCallback((next: NinefoldV3State): boolean => {
    const result = ninefoldV3Storage.saveState(next);
    if (result.ok) replaceState(next);
    noteWrite(result);
    return result.ok;
  }, [noteWrite, replaceState]);

  const updateDraft = useCallback<V3AppContextValue["updateDraft"]>((patch) => {
    const current = draftRef.current;
    const next: DraftWorldIdentity = {
      ...current,
      ...patch,
      version: V3_SCHEMA_VERSION,
      stableSeed: current.stableSeed,
      updatedAt: new Date().toISOString(),
    };
    if (!isDraftWorldIdentity(next)) return false;
    const result = ninefoldV3Storage.saveDraft(next);
    replaceDraft(next);
    noteWrite(result);
    return true;
  }, [noteWrite, replaceDraft]);

  const completeBuilder = useCallback<V3AppContextValue["completeBuilder"]>((personalityAnswers) => {
    if (!isPreferenceAnswers(personalityAnswers)) return false;
    if (stateRef.current) return true;
    const current = draftRef.current;
    const {
      birthMonth,
      birthDay,
      zodiacSign,
      cloudArchetype,
      worldPrototype,
    } = current;
    if (
      birthMonth === undefined
      || birthDay === undefined
      || zodiacSign === undefined
      || cloudArchetype === undefined
      || worldPrototype === undefined
      || !current.bareTreeBorn
      || !isValidBirthDate(birthMonth, birthDay)
      || zodiacSign !== deriveZodiacSign(birthMonth, birthDay)
      || !PATH_NUMBERS.some((path) => path === worldPrototype)
    ) {
      return false;
    }

    const completedAt = new Date().toISOString();
    const profileId = createLocalId("profile");
    const next: NinefoldV3State = {
      version: V3_SCHEMA_VERSION,
      profile: {
        version: V3_SCHEMA_VERSION,
        id: profileId,
        stableSeed: current.stableSeed,
        ...(current.nickname ? { nickname: current.nickname } : {}),
        birthMonth,
        birthDay,
        zodiacSign,
        cloudArchetype,
        worldPrototype,
        personality: derivePersonalityPreferences(personalityAnswers),
        createdAt: completedAt,
        preferredAmbientMode: current.preferredAmbientMode,
      },
      world: {
        profileId,
        bareTreeBorn: true,
        bornAt: completedAt,
        leafLayoutVersion: V3_LEAF_LAYOUT_VERSION,
      },
      checkIns: {},
      meditation: {
        ...EMPTY_MEDITATION_PROGRESS_V3,
        sessions: [],
      },
    };
    const stored = persistState(next);
    if (stored) noteWrite(ninefoldV3Storage.removeDraft());
    return stored;
  }, [noteWrite, persistState]);

  const saveDailyCheckIn = useCallback<V3AppContextValue["saveDailyCheckIn"]>((input) => {
    const current = stateRef.current;
    if (!current || !isRatingNine(input.mood) || !isRatingNine(input.energy)) return null;
    const localDate = input.localDate ?? localDateKey();
    const updatedAt = normaliseIsoInstant(input.now);
    if (!updatedAt) return null;
    try {
      const semanticReading = createDailyReadingSemantics({
        localDate,
        stableSeed: current.profile.stableSeed,
        zodiacSign: current.profile.zodiacSign,
        personality: current.profile.personality,
        mood: input.mood,
        energy: input.energy,
      });
      const previous = current.checkIns[localDate]?.semanticReading;
      const sealedReading = previous ? {
        ...semanticReading,
        keywordId: previous.keywordId,
        favourIds: previous.favourIds,
        easeOffIds: previous.easeOffIds,
      } : semanticReading;
      const checkIn = {
        localDate,
        mood: input.mood,
        energy: input.energy,
        derivedStateCell: semanticReading.stateCell,
        semanticReading: sealedReading,
        updatedAt,
      } as const;
      const stored = persistState({
        ...current,
        checkIns: {
          ...current.checkIns,
          [localDate]: checkIn,
        },
      });
      return stored ? checkIn : null;
    } catch {
      return null;
    }
  }, [persistState]);

  const completeDailySession = useCallback<V3AppContextValue["completeDailySession"]>((input) => {
    const current = stateRef.current;
    if (!current) return { added: false, state: null };
    try {
      const meditation = recordCompletedSession(current.meditation, {
        ...input,
        localDate: input.localDate ?? localDateKey(),
      });
      if (meditation === current.meditation) return { added: false, state: current };
      const leafIndex = current.meditation.leafCount;
      const next: NinefoldV3State = {
        ...current,
        profile: {
          ...current.profile,
          preferredAmbientMode: input.ambientMode,
        },
        meditation,
      };
      const stored = persistState(next);
      if (!stored) return { added: false, state: current };
      if (newLeafTimerRef.current !== null) window.clearTimeout(newLeafTimerRef.current);
      setNewLeafIndex(leafIndex);
      newLeafTimerRef.current = window.setTimeout(() => {
        setNewLeafIndex((active) => active === leafIndex ? null : active);
        newLeafTimerRef.current = null;
      }, 4_500);
      return { added: true, state: next };
    } catch {
      return { added: false, state: current };
    }
  }, [persistState]);

  const updatePreferences = useCallback<V3AppContextValue["updatePreferences"]>((answers) => {
    const current = stateRef.current;
    if (!current || !isPreferenceAnswers(answers)) return false;
    try {
      const personality = derivePersonalityPreferences(answers);
      const updatedAt = new Date().toISOString();
      const checkIns = Object.fromEntries(Object.entries(current.checkIns).map(([date, checkIn]) => {
        const semanticReading = createDailyReadingSemantics({
          localDate: date,
          stableSeed: current.profile.stableSeed,
          zodiacSign: current.profile.zodiacSign,
          personality,
          mood: checkIn.mood,
          energy: checkIn.energy,
        });
        return [date, {
          ...checkIn,
          derivedStateCell: semanticReading.stateCell,
          semanticReading: {
            ...semanticReading,
            keywordId: checkIn.semanticReading.keywordId,
            favourIds: checkIn.semanticReading.favourIds,
            easeOffIds: checkIn.semanticReading.easeOffIds,
          },
          updatedAt,
        }];
      }));
      return persistState({
        ...current,
        profile: { ...current.profile, personality },
        checkIns,
      });
    } catch {
      return false;
    }
  }, [persistState]);

  const updateAudioPreferences = useCallback<V3AppContextValue["updateAudioPreferences"]>((input) => {
    if (input.preferredAmbientMode !== undefined
      && !AMBIENT_MODES.some((mode) => mode === input.preferredAmbientMode)) {
      return false;
    }
    if (input.audioMuted !== undefined && typeof input.audioMuted !== "boolean") return false;
    if (input.audioVolume !== undefined
      && (!Number.isFinite(input.audioVolume) || input.audioVolume < 0 || input.audioVolume > 1)) {
      return false;
    }

    const current = stateRef.current;
    if (!current) {
      return input.preferredAmbientMode === undefined
        ? false
        : updateDraft({ preferredAmbientMode: input.preferredAmbientMode });
    }
    return persistState({
      ...current,
      profile: {
        ...current.profile,
        preferredAmbientMode: input.preferredAmbientMode ?? current.profile.preferredAmbientMode,
      },
      meditation: {
        ...current.meditation,
        audioMuted: input.audioMuted ?? current.meditation.audioMuted,
        audioVolume: input.audioVolume ?? current.meditation.audioVolume,
      },
    });
  }, [persistState, updateDraft]);

  const redrawWorld = useCallback((cloudArchetype: CloudArchetype, worldPrototype: (typeof PATH_NUMBERS)[number]) => {
    const current = stateRef.current;
    if (!current || !CLOUD_ARCHETYPES.includes(cloudArchetype) || !PATH_NUMBERS.includes(worldPrototype)) return false;
    return persistState({
      ...current,
      profile: { ...current.profile, cloudArchetype, worldPrototype },
    });
  }, [persistState]);

  const clearNewLeaf = useCallback(() => {
    if (newLeafTimerRef.current !== null) window.clearTimeout(newLeafTimerRef.current);
    newLeafTimerRef.current = null;
    setNewLeafIndex(null);
  }, []);

  const resetV3 = useCallback(() => {
    const cleared = ninefoldV3Storage.clearAll();
    if (!cleared.ok) {
      noteWrite(cleared);
      return false;
    }
    const freshDraft = createFreshDraft();
    const draftStored = ninefoldV3Storage.saveDraft(freshDraft);
    replaceState(null);
    replaceDraft(freshDraft);
    clearNewLeaf();
    noteWrite(draftStored);
    return true;
  }, [clearNewLeaf, noteWrite, replaceDraft, replaceState]);

  const refreshFromStorage = useCallback(() => {
    const next = readInitialSnapshot();
    replaceState(next.state);
    replaceDraft(next.draft);
    setStorageAvailable(next.storageAvailable);
    setStorageError(next.storageError);
    setHasStoredData(next.hasStoredData);
    clearNewLeaf();
  }, [clearNewLeaf, replaceDraft, replaceState]);

  useEffect(() => () => {
    if (newLeafTimerRef.current !== null) window.clearTimeout(newLeafTimerRef.current);
  }, []);

  useEffect(() => {
    const syncDate = () => setTodayKey(localDateKey());
    const timer = window.setInterval(syncDate, 60_000);
    document.addEventListener("visibilitychange", syncDate);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", syncDate);
    };
  }, []);

  const todayCheckIn = state?.checkIns[todayKey] ?? null;
  const value = useMemo<V3AppContextValue>(() => ({
    locale,
    copy,
    state,
    draft,
    todayKey,
    todayCheckIn,
    newLeafIndex,
    hasStoredData,
    storageAvailable,
    storageError,
    updateDraft,
    completeBuilder,
    saveDailyCheckIn,
    completeDailySession,
    updatePreferences,
    updateAudioPreferences,
    redrawWorld,
    clearNewLeaf,
    resetV3,
    refreshFromStorage,
  }), [
    clearNewLeaf,
    completeBuilder,
    completeDailySession,
    copy,
    draft,
    hasStoredData,
    locale,
    newLeafIndex,
    refreshFromStorage,
    resetV3,
    saveDailyCheckIn,
    state,
    storageAvailable,
    storageError,
    todayCheckIn,
    todayKey,
    updateAudioPreferences,
    redrawWorld,
    updateDraft,
    updatePreferences,
  ]);

  return <V3AppContext.Provider value={value}>{children}</V3AppContext.Provider>;
}

function V3Routes() {
  const { locale, state } = useV3ContextForRoutes();
  const routeLanguages = ["en", "zh"] as const;
  return (
    <Routes>
      <Route path="/" element={<Navigate to={localizedPath("/", locale)} replace />} />
      {routeLanguages.map((language) => (
        <Fragment key={language}>
          <Route
            path={`/${language}/`}
            element={state
              ? <Navigate to={`/${language}/today`} replace />
              : <WorldBuilderPage />}
          />
          <Route path={`/${language}/today`} element={<RequireV3State><TodayPage /></RequireV3State>} />
          <Route path={`/${language}/world`} element={<RequireV3State><WorldPage /></RequireV3State>} />
          <Route path={`/${language}/growth`} element={<RequireV3State><GrowthPage /></RequireV3State>} />
          <Route path={`/${language}/about`} element={<AboutPage />} />
          <Route path={`/${language}/preferences`} element={<RequireV3State><PreferencesPage /></RequireV3State>} />
          <Route path={`/${language}/onboarding`} element={<Navigate to={`/${language}/`} replace />} />
          <Route path={`/${language}/archive`} element={<Navigate to={`/${language}/growth`} replace />} />
          <Route path={`/${language}/method`} element={<Navigate to={`/${language}/about`} replace />} />
        </Fragment>
      ))}
      <Route path="/today" element={<Navigate to={localizedPath("/today", locale)} replace />} />
      <Route path="/world" element={<Navigate to={localizedPath("/world", locale)} replace />} />
      <Route path="/growth" element={<Navigate to={localizedPath("/growth", locale)} replace />} />
      <Route path="/about" element={<Navigate to={localizedPath("/about", locale)} replace />} />
      <Route path="/preferences" element={<Navigate to={localizedPath("/preferences", locale)} replace />} />
      <Route path="/onboarding" element={<Navigate to={localizedPath("/", locale)} replace />} />
      <Route path="/archive" element={<Navigate to={localizedPath("/growth", locale)} replace />} />
      <Route path="/method" element={<Navigate to={localizedPath("/about", locale)} replace />} />
      <Route path="*" element={<Navigate to={localizedPath("/", locale)} replace />} />
    </Routes>
  );
}

function useV3ContextForRoutes() {
  const value = useContext(V3AppContext);
  if (!value) throw new Error("V3 routes must be rendered within the V3 controller.");
  return value;
}

function RequireV3State({ children }: { children: ReactNode }) {
  const { locale, state } = useV3ContextForRoutes();
  return state ? children : <Navigate to={localizedPath("/", locale)} replace />;
}

function readInitialSnapshot(): ControllerSnapshot {
  const state = ninefoldV3Storage.readState();
  const storedDraft = ninefoldV3Storage.readDraft();
  let draft = state ? draftFromState(state) : storedDraft;
  let draftWrite: V3StorageWriteResult | null = null;
  if (!draft) {
    draft = createFreshDraft();
    draftWrite = ninefoldV3Storage.saveDraft(draft);
  }
  const storageAvailable = ninefoldV3Storage.isAvailable();
  const diagnostics = ninefoldV3Storage.getDiagnostics();
  return {
    state,
    draft,
    storageAvailable,
    storageError: !storageAvailable
      ? "unavailable"
      : draftWrite && !draftWrite.ok
        ? "write"
        : classifyDiagnostics(diagnostics),
    hasStoredData: ninefoldV3Storage.hasAnyData(),
  };
}

function createFreshDraft(now = new Date().toISOString()): DraftWorldIdentity {
  return {
    version: V3_SCHEMA_VERSION,
    stableSeed: createLocalId("world"),
    stage: "birth-date",
    bareTreeBorn: false,
    preferredAmbientMode: "ocean",
    updatedAt: now,
  };
}

function draftFromState(state: NinefoldV3State): DraftWorldIdentity {
  const profile = state.profile;
  return {
    version: V3_SCHEMA_VERSION,
    stableSeed: profile.stableSeed,
    stage: "personality",
    birthMonth: profile.birthMonth,
    birthDay: profile.birthDay,
    zodiacSign: profile.zodiacSign,
    cloudArchetype: profile.cloudArchetype,
    worldPrototype: profile.worldPrototype,
    bareTreeBorn: true,
    ...(profile.nickname ? { nickname: profile.nickname } : {}),
    personalityAnswers: {
      eOrI: profile.personality.eOrI,
      sOrN: profile.personality.sOrN,
      tOrF: profile.personality.tOrF,
      jOrP: profile.personality.jOrP,
    },
    preferredAmbientMode: profile.preferredAmbientMode,
    updatedAt: profile.createdAt,
  };
}

function classifyDiagnostics(diagnostics: readonly V3StorageDiagnostic[]): V3StorageErrorKind | null {
  if (diagnostics.some((item) => item.kind === "unavailable")) return "unavailable";
  if (diagnostics.some((item) => item.kind === "corrupt" || item.kind === "outdated")) return "corrupt";
  if (diagnostics.some((item) => item.kind === "read-failed")) return "read";
  if (diagnostics.some((item) => item.kind === "write-failed")) return "write";
  return null;
}

function createLocalId(prefix: string): string {
  try {
    if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  } catch {
    // A monotonic fallback is enough for a browser-local identity.
  }
  localIdSequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${localIdSequence.toString(36)}`;
}

function normaliseIsoInstant(value?: string): string | null {
  const date = value === undefined ? new Date() : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
