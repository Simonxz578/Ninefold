import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { InlineNotice } from "../components/InlineNotice";
import { LivingLandscape } from "../components/landscape";
import { PatternArt } from "../components/PatternArt";
import { ResultView } from "../components/ResultView";
import { ScoreDisplay } from "../components/ScoreDisplay";
import { WeeklyComposition } from "../components/WeeklyComposition";
import {
  CARE_ACTIONS,
  createGrowthEventFromDailyEntry,
  createWeeklyReflection,
  formatReflectionForLocale,
  getActiveVersion,
  getColorSymbol,
  getSeasonIndex,
  getTimeOfDay,
} from "../domain";
import type { GrowthStage } from "../domain/restSession";
import type {
  CareAction,
  CareActionSource,
  DailyEntry,
  GrowthEvent,
  PatternVariant,
  TimeOfDay,
} from "../domain/types";
import { interpolate, localizedPath, useI18n } from "../i18n";
import { downloadSvgById } from "../utils/download";

interface SampleActionResult {
  ok: boolean;
  conflict?: boolean;
  message: string;
}

interface ArchivePageProps {
  entries: DailyEntry[];
  growthStage?: GrowthStage;
  storageWarning?: string;
  onLoadSample: (confirmed: boolean) => SampleActionResult;
  onRemoveSamples: () => SampleActionResult;
  onSwitchVariant: (date: string, variant: PatternVariant) => void;
  getShareCaption: (entry: DailyEntry) => string;
}

type GrowthMode = "living" | "memory";
type DataView = "recent" | "sample";
type NoticeTone = "success" | "error" | "info";

interface PageNotice {
  message: string;
  tone: NoticeTone;
}

interface EntryCareAction {
  careAction: CareAction;
  careActionSource: CareActionSource;
}

function isCareAction(value: unknown): value is CareAction {
  return typeof value === "string" && CARE_ACTIONS.some((careAction) => careAction === value);
}

function getEntryCareAction(entry: DailyEntry): EntryCareAction {
  const storedCareAction = "careAction" in entry ? entry.careAction : undefined;
  if (isCareAction(storedCareAction)) {
    return {
      careAction: storedCareAction,
      careActionSource: entry.isSample ? "sample" : "user",
    };
  }
  if (entry.isSample) {
    const dailyNumber = entry.original.configuration.dailyNumber;
    const sampleSeed = [...entry.date].reduce<number>(
      (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
      Number(dailyNumber),
    );
    return {
      careAction: CARE_ACTIONS[sampleSeed % CARE_ACTIONS.length] ?? "observe",
      careActionSource: "sample",
    };
  }
  return {
    careAction: "observe",
    careActionSource: "migrated-default",
  };
}

function getEntryTimeOfDay(entry: DailyEntry): TimeOfDay {
  const createdAt = new Date(entry.createdAt);
  return Number.isNaN(createdAt.getTime()) ? "day" : getTimeOfDay(createdAt.getHours());
}

function activePatternForEvent(event: GrowthEvent) {
  return event.activeVariant === "reframe" && event.reframe ? event.reframe : event.pattern;
}

export function ArchivePage({
  entries,
  growthStage = 0,
  storageWarning,
  onLoadSample,
  onRemoveSamples,
  onSwitchVariant,
  getShareCaption,
}: ArchivePageProps) {
  const { formatDate, locale, t } = useI18n();
  const [searchParams] = useSearchParams();
  const sampleRequested = searchParams.get("sample") === "1";
  const handledSampleRequest = useRef(false);
  const [confirmingSample, setConfirmingSample] = useState(false);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [notice, setNotice] = useState<PageNotice | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [growthMode, setGrowthMode] = useState<GrowthMode>("living");
  const [dataView, setDataView] = useState<DataView>(sampleRequested ? "sample" : "recent");
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({});
  const detailRef = useRef<HTMLElement>(null);
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);

  const { sampleEntries, realEntries } = useMemo(() => ({
    sampleEntries: entries.filter((entry) => entry.isSample),
    realEntries: entries.filter((entry) => !entry.isSample),
  }), [entries]);
  const visibleEntries = useMemo(
    () => [...(dataView === "sample" && sampleEntries.length > 0
      ? sampleEntries
      : realEntries.length > 0
        ? realEntries
        : entries)]
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-7),
    [dataView, entries, realEntries, sampleEntries],
  );
  const growthEvents = useMemo(
    () => visibleEntries.map((entry) => {
      const { careAction, careActionSource } = getEntryCareAction(entry);
      return createGrowthEventFromDailyEntry(entry, {
        careAction,
        careActionSource,
        localeAtCreation: locale,
        timeOfDay: getEntryTimeOfDay(entry),
      });
    }),
    [locale, visibleEntries],
  );
  const visibleGrowthEvents = useMemo(
    () => growthEvents.filter((event) => layerVisibility[event.date] !== false),
    [growthEvents, layerVisibility],
  );
  const selectedEntry = entries.find((entry) => entry.date === selectedDate) ?? null;
  const weekly = createWeeklyReflection(visibleEntries);
  const weeklyCopy = createLocalizedWeeklyCopy(weekly, visibleEntries, t);
  const latestGrowthEvent = visibleGrowthEvents.at(-1);
  const latestEntry = visibleEntries.at(-1);
  const landscapePath = latestGrowthEvent?.path ?? latestEntry?.original.configuration.pathNumber ?? 1;
  const visibleLayerDates = visibleEntries
    .filter((entry) => layerVisibility[entry.date] !== false)
    .map((entry) => formatDate(entry.date, "monthDay"));
  const layerDescription = visibleLayerDates.length > 0
      ? interpolate(t.growth.visibleLayerDescription, {
        count: visibleLayerDates.length,
        dates: visibleLayerDates.join(t.archive.dateListSeparator),
      })
    : t.growth.noLayers;

  useEffect(() => {
    setLayerVisibility((current) => {
      const next = { ...current };
      visibleEntries.forEach((entry) => {
        if (!(entry.date in next)) next[entry.date] = true;
      });
      return next;
    });
  }, [visibleEntries]);

  useEffect(() => {
    if (!sampleRequested || handledSampleRequest.current) return;
    handledSampleRequest.current = true;
    if (sampleEntries.length > 0) {
      setNotice({ message: t.growth.alreadyLoaded, tone: "info" });
    } else if (realEntries.length > 0) {
      setConfirmingSample(true);
    } else {
      const result = onLoadSample(false);
      if (result.ok) {
        setDataView("sample");
        setNotice({ message: t.growth.sampleLoaded, tone: "success" });
      } else {
        setNotice({ message: result.message, tone: "error" });
      }
    }
  }, [onLoadSample, realEntries.length, sampleEntries.length, sampleRequested, t.growth.alreadyLoaded, t.growth.sampleLoaded]);

  useEffect(() => {
    if (!selectedDate) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const detail = detailRef.current;
      if (!detail) return;
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      detail.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      detail.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedDate]);

  const requestSample = () => {
    const result = onLoadSample(false);
    if (result.conflict) {
      setConfirmingSample(true);
    } else if (result.ok) {
      setDataView("sample");
      setNotice({ message: t.growth.sampleLoaded, tone: "success" });
    } else {
      setNotice({ message: result.message, tone: "error" });
    }
  };

  const loadConfirmed = () => {
    setConfirmingSample(false);
    const result = onLoadSample(true);
    if (result.ok) {
      setDataView("sample");
      setNotice({ message: t.growth.sampleLoaded, tone: "success" });
    } else {
      setNotice({ message: result.message, tone: "error" });
    }
  };

  const removeSamples = () => {
    setConfirmingRemoval(false);
    setSelectedDate((current) => entries.find((entry) => entry.date === current)?.isSample ? null : current);
    setDataView("recent");
    const result = onRemoveSamples();
    setNotice({
      message: result.ok ? t.growth.sampleRemoved : result.message,
      tone: result.ok ? "success" : "error",
    });
  };

  const closeHistorical = () => {
    setSelectedDate(null);
    window.requestAnimationFrame(() => detailTriggerRef.current?.focus({ preventScroll: false }));
  };

  const downloadWeek = () => {
    try {
      if (!downloadSvgById("weekly-composition", t.archive.downloadFilename)) {
        throw new Error();
      }
      setNotice({ message: t.growth.downloadedWeek, tone: "success" });
    } catch {
      setNotice({ message: t.growth.downloadFailed, tone: "error" });
    }
  };

  const weeklyLayers = visibleEntries.map((entry) => ({
    id: entry.date,
    date: formatDate(entry.date, "monthDay"),
    pattern: getActiveVersion(entry).configuration,
    visible: layerVisibility[entry.date] !== false,
  }));

  const switchDataView = (nextView: DataView) => {
    setSelectedDate(null);
    setDataView(nextView);
  };

  return (
    <div className="page growth-page">
      <header className="page-hero container growth-heading">
        <div>
          <p className="eyebrow">{t.growth.eyebrow}</p>
          <h1>{t.growth.title}</h1>
        </div>
        <p>{t.growth.intro}</p>
      </header>

      {notice && (
        <div className="container">
          <InlineNotice tone={notice.tone} live>{notice.message}</InlineNotice>
        </div>
      )}
      {storageWarning && (
        <div className="container">
          <InlineNotice tone="warning" live>{storageWarning}</InlineNotice>
        </div>
      )}

      {entries.length > 0 && (
        <div className="container">
          <div className="growth-mode-switcher" role="group" aria-label={t.growth.viewLabel}>
            <button
              type="button"
              aria-pressed={growthMode === "living"}
              aria-controls="growth-living-panel"
              onClick={() => {
                setSelectedDate(null);
                setGrowthMode("living");
              }}
            >
              {t.growth.livingView}
            </button>
            <button
              type="button"
              aria-pressed={growthMode === "memory"}
              aria-controls="growth-memory-panel"
              onClick={() => setGrowthMode("memory")}
            >
              {t.growth.memoryView}
            </button>
          </div>
        </div>
      )}

      {sampleEntries.length > 0 && realEntries.length > 0 && (
        <fieldset className="archive-view-switcher container">
          <legend>{t.growth.weeklySummary}</legend>
          <div className="segmented-control">
            <label>
              <input
                type="radio"
                name="growth-data-view"
                checked={dataView === "recent"}
                onChange={() => switchDataView("recent")}
              />
              <span>{t.growth.recentActivity}</span>
            </label>
            <label>
              <input
                type="radio"
                name="growth-data-view"
                checked={dataView === "sample"}
                onChange={() => switchDataView("sample")}
              />
              <span>{t.growth.sampleWeek}</span>
            </label>
          </div>
        </fieldset>
      )}

      {entries.length === 0 ? (
        <section className="empty-archive container">
          <div className="empty-archive__art" aria-hidden="true"><i /><i /><i /><span>{t.archive.emptyWeekLength}</span></div>
          <div>
            <p className="eyebrow">{t.growth.emptyEyebrow}</p>
            <h2>{t.growth.emptyTitle}</h2>
            <p>{t.growth.emptyBody}</p>
            <div className="button-row">
              <Link className="button button--primary" to={localizedPath("/today", locale)}>
                {t.growth.createToday}
              </Link>
              <button className="button button--secondary" type="button" onClick={requestSample}>
                {t.growth.loadSample}
              </button>
            </div>
          </div>
        </section>
      ) : growthMode === "living" ? (
        <section
          id="growth-living-panel"
          className="growth-view-panel container"
          aria-labelledby="growth-living-title"
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t.terms.livingLandscape}</p>
              <h2 id="growth-living-title">{t.growth.livingView}</h2>
            </div>
            <p>{t.growth.livingDescription}</p>
          </div>
          <div className="living-growth-stage">
            <LivingLandscape
              path={landscapePath}
              events={visibleGrowthEvents}
              weather={latestGrowthEvent?.weather}
              activePattern={latestGrowthEvent ? activePatternForEvent(latestGrowthEvent) : undefined}
              careAction={latestGrowthEvent?.careAction}
              seasonIndex={getSeasonIndex(growthEvents.length)}
              locale={locale}
              title={t.growth.livingView}
              description={layerDescription}
              growthStage={growthStage}
            />
            <fieldset className="living-growth-stage__controls">
              <legend>{t.growth.visibleDays}</legend>
              {visibleEntries.map((entry) => {
                const version = getActiveVersion(entry);
                const color = getColorSymbol(version.configuration.primaryColor);
                return (
                  <label key={entry.date}>
                    <input
                      type="checkbox"
                      checked={layerVisibility[entry.date] !== false}
                      onChange={(event) => setLayerVisibility((current) => ({
                        ...current,
                        [entry.date]: event.target.checked,
                      }))}
                    />
                    <i style={{ backgroundColor: color.hex }} aria-hidden="true" />
                    <span>
                      {formatDate(entry.date, "monthDay")}
                      {t.archive.inlineSeparator}
                      {entry.isSample ? t.growth.sampleEntry : t.symbols.forms[version.configuration.form]}
                    </span>
                  </label>
                );
              })}
              {visibleGrowthEvents.length === 0 && <small>{t.growth.noLayers}</small>}
            </fieldset>
          </div>
        </section>
      ) : (
        <section
          id="growth-memory-panel"
          className="growth-view-panel container"
          aria-labelledby="growth-memory-title"
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t.terms.memoryView}</p>
              <h2 id="growth-memory-title">{t.growth.memoryView}</h2>
            </div>
            <p>{t.growth.memoryDescription}</p>
          </div>

          <section className="weekly-stage" aria-labelledby="weekly-title">
            <div className="weekly-stage__visual">
              <WeeklyComposition
                id="weekly-composition"
                entries={weeklyLayers}
                title={t.growth.weeklySummary}
                description={layerDescription}
              />
            </div>
            <div className="weekly-stage__controls">
              <p className="eyebrow">{t.growth.weeklySummary}</p>
              <h2 id="weekly-title">
                {dataView === "sample" && sampleEntries.length > 0
                  ? t.growth.sampleWeek
                  : t.growth.recentActivity}
              </h2>
              <p>{layerDescription}</p>
              <fieldset className="layer-toggles">
                <legend>{t.growth.visibleDays}</legend>
                {visibleEntries.map((entry) => {
                  const version = getActiveVersion(entry);
                  const color = getColorSymbol(version.configuration.primaryColor);
                  return (
                    <label key={entry.date}>
                      <input
                        type="checkbox"
                        checked={layerVisibility[entry.date] !== false}
                        onChange={(event) => setLayerVisibility((current) => ({
                          ...current,
                          [entry.date]: event.target.checked,
                        }))}
                      />
                      <i style={{ backgroundColor: color.hex }} aria-hidden="true" />
                      <span>{formatDate(entry.date, "monthDay")}</span>
                      <small>{entry.isSample ? t.common.sample : t.symbols.forms[version.configuration.form]}</small>
                    </label>
                  );
                })}
              </fieldset>
              <button className="button button--secondary" type="button" onClick={downloadWeek}>
                {t.growth.downloadWeek}
              </button>
            </div>
          </section>

          <section className="weekly-reflection" aria-labelledby="weekly-reflection-title">
            <div className="weekly-reflection__intro">
              <p className="eyebrow">{t.growth.weeklyReflection}</p>
              <h2 id="weekly-reflection-title">{weeklyCopy.theme}</h2>
              <p>{t.growth.memoryDescription}</p>
            </div>
            <div className="weekly-reflection__body">
              <ScoreDisplay scores={weekly.averages} context="weekly" />
              <ul>
                {weeklyCopy.observations.map((observation) => <li key={observation}>{observation}</li>)}
              </ul>
              <p className="weekly-reflection__invitation">
                <span>{t.growth.noticeLabel}</span>
                {weeklyCopy.invitation}
              </p>
            </div>
          </section>

          <section className="archive-list" aria-labelledby="archive-list-title">
            <div className="section-heading section-heading--inline">
              <div>
                <p className="eyebrow">{t.growth.memoryView}</p>
                <h2 id="archive-list-title">
                  {dataView === "sample" && sampleEntries.length > 0
                    ? t.growth.sampleWeek
                    : t.growth.recentEntries}
                </h2>
              </div>
              <div className="archive-list__actions">
                {sampleEntries.length > 0 ? (
                  <button className="text-button" type="button" onClick={() => setConfirmingRemoval(true)}>
                    {t.growth.removeSample}
                  </button>
                ) : (
                  <button className="text-button" type="button" onClick={requestSample}>
                    {t.growth.loadSample}
                  </button>
                )}
              </div>
            </div>
            <div className="archive-grid memory-grid">
              {[...visibleEntries].sort((a, b) => b.date.localeCompare(a.date)).map((entry) => {
                const version = getActiveVersion(entry);
                const config = version.configuration;
                const color = getColorSymbol(config.primaryColor);
                return (
                  <button
                    className="archive-card memory-card"
                    key={`${entry.date}-${entry.profileId}`}
                    type="button"
                    onClick={(event) => {
                      detailTriggerRef.current = event.currentTarget;
                      setSelectedDate(entry.date);
                    }}
                  >
                    <div className="archive-card__topline">
                      <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                      {entry.isSample && <span className="sample-badge">{t.growth.sampleEntry}</span>}
                    </div>
                    <div className="archive-card__visual"><PatternArt pattern={config} animated={false} decorative /></div>
                    <div className="archive-card__symbols">
                      <strong>{config.dailyNumber}</strong>
                      <span><i style={{ backgroundColor: color.hex }} />{t.symbols.colours[config.primaryColor]}</span>
                      <span>{t.symbols.forms[config.form]}</span>
                    </div>
                    <div className="archive-card__scores">
                      <span>{t.scores.clarity} <b>{config.scores.clarity}</b></span>
                      <span>{t.scores.momentum} <b>{config.scores.momentum}</b></span>
                      <span>{t.scores.tension} <b>{config.scores.tension}</b></span>
                    </div>
                    <p>{formatReflectionForLocale(entry, locale).theme}</p>
                    <div className="archive-card__footer">
                      <span>{entry.reframe
                        ? interpolate(t.archive.originalAndAlternate, {
                            original: t.common.original,
                            alternate: t.common.alternate,
                          })
                        : t.common.original}</span>
                      <span>{t.growth.historicalDetail} <span aria-hidden="true">→</span></span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </section>
      )}

      {selectedEntry && (
        <section
          ref={detailRef}
          className="historical-result"
          aria-label={interpolate(t.archive.historicalDetailAriaLabel, {
            date: formatDate(selectedEntry.date),
          })}
          tabIndex={-1}
        >
          <div className="container historical-result__bar">
            <div>
              <span className="eyebrow">{t.growth.historicalDetail}</span>
              <strong>{formatDate(selectedEntry.date)}</strong>
            </div>
            <button className="button button--secondary" type="button" onClick={closeHistorical}>
              {t.growth.closeHistorical}
            </button>
          </div>
          <ResultView
            entry={selectedEntry}
            dateLabel={formatDate(selectedEntry.date)}
            historical
            onSwitchVariant={(variant) => onSwitchVariant(selectedEntry.date, variant)}
            shareCaption={getShareCaption(selectedEntry)}
          />
        </section>
      )}

      <ConfirmDialog
        open={confirmingSample}
        title={t.growth.loadConflictTitle}
        description={t.growth.loadConflictDescription}
        confirmLabel={t.growth.loadBesideReal}
        cancelLabel={t.common.cancel}
        onCancel={() => setConfirmingSample(false)}
        onConfirm={loadConfirmed}
      />
      <ConfirmDialog
        open={confirmingRemoval}
        title={t.growth.removeSampleTitle}
        description={t.growth.removeSampleDescription}
        confirmLabel={t.growth.removeSample}
        cancelLabel={t.common.cancel}
        tone="danger"
        onCancel={() => setConfirmingRemoval(false)}
        onConfirm={removeSamples}
      />
    </div>
  );
}

function createLocalizedWeeklyCopy(
  weekly: ReturnType<typeof createWeeklyReflection>,
  entries: DailyEntry[],
  t: ReturnType<typeof useI18n>["t"],
) {
  if (entries.length === 0) {
    return {
      ...weekly,
      theme: t.archive.weekly.emptyTheme,
      observations: [t.archive.weekly.emptyObservation],
      invitation: t.archive.weekly.emptyInvitation,
    };
  }

  const colours = weekly.frequentColors.map((colour) => t.symbols.colours[colour]);
  const direction = t.symbols.directions[weekly.dominantDirection];
  const repeatedForms = weekly.repeatedForms.map((form) => t.symbols.forms[form]);
  const versions = entries.map(getActiveVersion);
  const firstScores = versions[0]?.configuration.scores;
  const lastScores = versions.at(-1)?.configuration.scores;
  const observations = [
    interpolate(t.archive.weekly.directionObservation, { direction }),
    repeatedForms.length > 0
      ? interpolate(t.archive.weekly.repeatedFormsObservation, {
          forms: repeatedForms.join(t.archive.weekly.valueJoiner),
        })
      : t.archive.weekly.variedFormsObservation,
  ];

  if (firstScores && lastScores && entries.length > 1) {
    observations.push(localizedMovementObservation(
      t.scores.clarity,
      firstScores.clarity,
      lastScores.clarity,
      t,
    ));
    observations.push(localizedMovementObservation(
      t.scores.momentum,
      firstScores.momentum,
      lastScores.momentum,
      t,
    ));
  }

  return {
    ...weekly,
    theme: interpolate(t.archive.weekly.theme, {
      colours: colours.join(t.archive.weekly.valueJoiner),
      direction,
    }),
    observations,
    invitation: t.archive.weekly.invitation,
  };
}

function localizedMovementObservation(
  label: string,
  start: number,
  end: number,
  t: ReturnType<typeof useI18n>["t"],
): string {
  const delta = end - start;
  if (Math.abs(delta) <= 1) {
    return interpolate(t.archive.weekly.steadyObservation, { label });
  }
  return interpolate(t.archive.weekly.movedObservation, {
    label,
    movement: delta > 0 ? t.archive.weekly.movementUp : t.archive.weekly.movementDown,
    start,
    end,
  });
}
