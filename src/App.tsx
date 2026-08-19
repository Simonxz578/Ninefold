import { Fragment, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import {
  buildLocalizedShareCaption,
  createDailyEntry,
  createGrowthEventFromDailyEntry,
  createSampleWeek,
  DEFAULT_REST_SESSION_PROGRESS,
  ninefoldV2Storage,
  reframeDailyEntry,
  removeSampleEntries,
  setActiveVariant,
  shiftLocalDate,
  toRecentSummary,
} from "./domain";
import type {
  CareAction,
  DailyCheckIn,
  DailyEntry,
  FeedbackChoice,
  LivingLandscape,
  PatternVariant,
  Profile,
  RestSessionProgress,
  StorageWriteResult,
  TimeOfDay,
} from "./domain";
import { I18nProvider, localizedPath, useI18n } from "./i18n";
import { AboutPage } from "./pages/AboutPage";
import { ArchivePage } from "./pages/ArchivePage";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { TodayPage } from "./pages/TodayPage";
import { localDateKey } from "./utils/date";

type StorageWarningKind = "" | "unavailable" | "corrupt" | "read" | "write";

interface InitialState {
  profile: Profile | null;
  entries: DailyEntry[];
  landscape: LivingLandscape | null;
  restProgress: RestSessionProgress;
  hasStoredData: boolean;
  storageWarningKind: StorageWarningKind;
}

function readInitialState(): InitialState {
  const profile = ninefoldV2Storage.readProfile();
  const entries = ninefoldV2Storage.readEntries();
  const landscape = ninefoldV2Storage.readLandscape();
  const restProgress = ninefoldV2Storage.readRestSessionProgress();
  ninefoldV2Storage.readCheckIns();
  ninefoldV2Storage.readFeedback();
  ninefoldV2Storage.readSampleWeekState();
  const hasStoredData = ninefoldV2Storage.hasAnyData();
  const diagnostics = ninefoldV2Storage.getDiagnostics();
  const storageWarningKind: StorageWarningKind = !ninefoldV2Storage.isAvailable()
    ? "unavailable"
    : diagnostics.some((item) => item.kind === "corrupt" || item.kind === "outdated")
      ? "corrupt"
      : diagnostics.length > 0
        ? "read"
        : "";
  return { profile, entries, landscape, restProgress, hasStoredData, storageWarningKind };
}

function localTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 6 || hour >= 21) return "night";
  if (hour < 11) return "morning";
  if (hour < 17) return "day";
  return "evening";
}

export function App() {
  return (
    <I18nProvider>
      <NinefoldApp />
    </I18nProvider>
  );
}

function NinefoldApp() {
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const [initial] = useState(readInitialState);
  const [profile, setProfile] = useState(initial.profile);
  const [entries, setEntries] = useState(initial.entries);
  const [landscape, setLandscape] = useState(initial.landscape);
  const [restProgress, setRestProgress] = useState(initial.restProgress);
  const [hasStoredData, setHasStoredData] = useState(initial.hasStoredData);
  const [storageWarningKind, setStorageWarningKind] = useState<StorageWarningKind>(initial.storageWarningKind);
  const today = localDateKey();
  const storageWarning = storageWarningKind === "unavailable"
    ? t.storage.unavailable
    : storageWarningKind === "corrupt"
      ? t.storage.corrupt
      : storageWarningKind === "write"
        ? t.storage.writeFailed
        : storageWarningKind === "read"
          ? t.storage.readFailed
          : "";

  useEffect(() => {
    setLandscape((current) => {
      if (!current || current.currentLocale === locale) return current;
      const next = { ...current, currentLocale: locale };
      ninefoldV2Storage.saveLandscape(next);
      return next;
    });
  }, [locale]);

  const recentSummaries = useMemo(
    () => entries
      .filter((entry) => !entry.isSample)
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-7)
      .map((entry) => toRecentSummary(entry)),
    [entries],
  );

  const todayEntry = profile
    ? entries.find((entry) => entry.date === today && !entry.isSample) ?? null
    : null;

  const noteWriteResult = (result: StorageWriteResult): boolean => {
    if (!result.ok) setStorageWarningKind("write");
    else setHasStoredData(ninefoldV2Storage.hasAnyData());
    return result.ok;
  };

  const saveProfile = (nextProfile: Profile) => {
    setProfile(nextProfile);
    noteWriteResult(ninefoldV2Storage.saveProfile(nextProfile));
  };

  const saveRestProgress = (nextProgress: RestSessionProgress) => {
    setRestProgress(nextProgress);
    noteWriteResult(ninefoldV2Storage.saveRestSessionProgress(nextProgress));
  };

  const syncLandscape = (
    nextEntry: DailyEntry,
    fallbackCareAction?: CareAction,
  ): void => {
    if (!profile || nextEntry.original.configuration.pathNumber !== profile.pathNumber) return;
    const existingEvent = landscape?.events.find((event) => event.date === nextEntry.date);
    const event = createGrowthEventFromDailyEntry(nextEntry, {
      careAction: existingEvent?.careAction ?? fallbackCareAction ?? "observe",
      careActionSource: existingEvent?.careActionSource ?? (fallbackCareAction ? "user" : "migrated-default"),
      localeAtCreation: existingEvent?.localeAtCreation ?? locale,
      timeOfDay: existingEvent?.weather.timeOfDay ?? localTimeOfDay(),
    });
    if (noteWriteResult(ninefoldV2Storage.saveGrowthEvent(profile, event, locale))) {
      setLandscape(ninefoldV2Storage.readLandscape());
    }
  };

  const replaceEntry = (nextEntry: DailyEntry, fallbackCareAction?: CareAction): boolean => {
    setEntries((current) => [
      ...current.filter((entry) => entry.date !== nextEntry.date),
      nextEntry,
    ].sort((left, right) => left.date.localeCompare(right.date)));
    const stored = noteWriteResult(ninefoldV2Storage.saveEntry(nextEntry));
    syncLandscape(nextEntry, fallbackCareAction);
    return stored;
  };

  const generateToday = (checkIn: DailyCheckIn, careAction: CareAction) => {
    if (!profile) throw new Error("A profile is required.");
    if (todayEntry) return;
    const entry = createDailyEntry(profile, checkIn, today, { recentSummaries });
    noteWriteResult(ninefoldV2Storage.saveCheckIn(today, checkIn));
    replaceEntry(entry, careAction);
  };

  const reframeToday = (): { ok: boolean; message?: string } => {
    if (!profile || !todayEntry) return { ok: false, message: t.today.reflect.viewAnotherAngle };
    const result = reframeDailyEntry(todayEntry, profile, recentSummaries);
    if (!result.ok) {
      return {
        ok: false,
        message: result.reason === "already-used"
          ? t.today.reflect.reframeUsed
          : t.errors.generic,
      };
    }
    replaceEntry(result.entry);
    return { ok: true };
  };

  const switchVariant = (date: string, variant: PatternVariant) => {
    const entry = entries.find((candidate) => candidate.date === date);
    if (!entry) return;
    replaceEntry({ ...setActiveVariant(entry, variant), updatedAt: new Date().toISOString() });
  };

  const saveFeedback = (choice: FeedbackChoice): { ok: boolean; message?: string } => {
    if (!todayEntry) return { ok: false, message: t.errors.generic };
    const updated: DailyEntry = {
      ...todayEntry,
      feedback: choice,
      updatedAt: new Date().toISOString(),
    };
    const entryStored = replaceEntry(updated);
    const feedbackStored = noteWriteResult(ninefoldV2Storage.saveFeedback({
      date: today,
      choice,
      recordedAt: new Date().toISOString(),
    }));
    return {
      ok: entryStored && feedbackStored,
      ...(!(entryStored && feedbackStored) ? { message: t.feedback.saveFailed } : {}),
    };
  };

  const loadSampleWeek = (confirmed: boolean) => {
    const realEntries = entries.filter((entry) => !entry.isSample);
    if (realEntries.length > 0 && !confirmed) {
      return { ok: false, conflict: true, message: t.growth.loadConflictDescription };
    }

    const occupied = new Set(realEntries.map((entry) => entry.date));
    let anchor = today;
    let samples = createSampleWeek(anchor);
    let attempts = 0;
    while (samples.some((entry) => occupied.has(entry.date)) && attempts < 60) {
      anchor = shiftLocalDate(anchor, -7);
      samples = createSampleWeek(anchor);
      attempts += 1;
    }
    if (samples.some((entry) => occupied.has(entry.date))) {
      return { ok: false, message: t.errors.generic };
    }

    const nextEntries = [...realEntries, ...samples].sort((left, right) => left.date.localeCompare(right.date));
    setEntries(nextEntries);
    const writeResults = [
      ninefoldV2Storage.removeSampleData(),
      ...samples.map((entry) => ninefoldV2Storage.saveEntry(entry)),
      ninefoldV2Storage.saveSampleWeekState({
        loaded: true,
        dates: samples.map((entry) => entry.date),
        loadedAt: new Date().toISOString(),
      }),
    ];
    const stored = writeResults.map(noteWriteResult).every(Boolean);
    return {
      ok: stored,
      message: stored ? t.growth.sampleLoaded : t.storage.writeFailed,
    };
  };

  const removeSamples = () => {
    setEntries((current) => removeSampleEntries(current));
    const stored = noteWriteResult(ninefoldV2Storage.removeSampleData());
    setLandscape(ninefoldV2Storage.readLandscape());
    setHasStoredData(ninefoldV2Storage.hasAnyData());
    return { ok: stored, message: stored ? t.growth.sampleRemoved : t.storage.writeFailed };
  };

  const clearData = () => {
    const result = ninefoldV2Storage.clearAll();
    if (!noteWriteResult(result)) return;
    setProfile(null);
    setEntries([]);
    setLandscape(null);
    setRestProgress({ ...DEFAULT_REST_SESSION_PROGRESS });
    setHasStoredData(false);
    setStorageWarningKind("");
    navigate(localizedPath("/onboarding", locale));
  };

  const shareCaption = (entry: DailyEntry, variant: PatternVariant = entry.activeVariant) => {
    const version = variant === "reframe" && entry.reframe ? entry.reframe : entry.original;
    return buildLocalizedShareCaption(
      { pathNumber: entry.original.configuration.pathNumber },
      entry,
      locale,
      t.paths[version.configuration.pathNumber].name,
      variant,
    );
  };

  const routeLanguages = ["en", "zh"] as const;

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to={localizedPath("/", locale)} replace />} />
        {routeLanguages.map((language) => (
          <Fragment key={language}>
            <Route path={`/${language}/`} element={<LandingPage />} />
            <Route
              path={`/${language}/onboarding`}
              element={<OnboardingPage profile={profile} storageWarning={storageWarning} onSave={saveProfile} />}
            />
            <Route
              path={`/${language}/today`}
              element={(
                <TodayPage
                  date={today}
                  profile={profile}
                  entry={todayEntry}
                  landscape={landscape}
                  restProgress={restProgress}
                  storageWarning={storageWarning}
                  onGenerate={generateToday}
                  onReframe={reframeToday}
                  onSwitchVariant={(variant) => switchVariant(today, variant)}
                  onFeedback={saveFeedback}
                  onRestProgressChange={saveRestProgress}
                  getShareCaption={shareCaption}
                />
              )}
            />
            <Route
              path={`/${language}/archive`}
              element={(
                <ArchivePage
                  entries={entries}
                  growthStage={restProgress.growthStage}
                  storageWarning={storageWarning}
                  onLoadSample={loadSampleWeek}
                  onRemoveSamples={removeSamples}
                  onSwitchVariant={switchVariant}
                  getShareCaption={(entry) => shareCaption(entry)}
                />
              )}
            />
            <Route
              path={`/${language}/about`}
              element={(
                <AboutPage
                  hasLocalData={Boolean(profile || entries.length || hasStoredData)}
                  storageWarning={storageWarning}
                  onClearData={clearData}
                />
              )}
            />
            <Route path={`/${language}/method`} element={<Navigate to={`/${language}/about`} replace />} />
          </Fragment>
        ))}
        <Route path="/onboarding" element={<Navigate to={localizedPath("/onboarding", locale)} replace />} />
        <Route path="/today" element={<Navigate to={localizedPath("/today", locale)} replace />} />
        <Route path="/archive" element={<Navigate to={localizedPath("/archive", locale)} replace />} />
        <Route path="/about" element={<Navigate to={localizedPath("/about", locale)} replace />} />
        <Route path="/method" element={<Navigate to={localizedPath("/about", locale)} replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
