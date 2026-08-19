import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { InlineNotice } from "../components/InlineNotice";
import {
  AttunementField,
  CareActionPicker,
  LivingLandscape,
  RestMode,
} from "../components/landscape";
import { ResultView } from "../components/ResultView";
import type { RestSessionProgress } from "../domain/restSession";
import { deriveWeatherState } from "../domain/weather";
import type {
  CareAction,
  DailyCheckIn,
  DailyEntry,
  FeedbackChoice,
  LivingLandscape as LivingLandscapeState,
  PatternVariant,
  Profile,
  TimeOfDay,
} from "../domain/types";
import { interpolate, localizedPath, useI18n } from "../i18n";

type TodayStage = "arrive" | "attune" | "tend" | "grow" | "reflect";

interface TodayPageProps {
  date: string;
  profile: Profile | null;
  entry: DailyEntry | null;
  landscape: LivingLandscapeState | null;
  restProgress: RestSessionProgress;
  storageWarning?: string;
  onGenerate: (checkIn: DailyCheckIn, careAction: CareAction) => void;
  onReframe: () => { ok: boolean; message?: string };
  onSwitchVariant: (variant: PatternVariant) => void;
  onFeedback: (choice: FeedbackChoice) => { ok: boolean; message?: string };
  onRestProgressChange: (progress: RestSessionProgress) => void;
  getShareCaption: (entry: DailyEntry, variant?: PatternVariant) => string;
}

const DEFAULT_CHECK_IN: DailyCheckIn = {
  energy: 3,
  clarity: 3,
  connection: "balanced",
  focus: "self",
};

function currentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 6 || hour >= 21) return "night";
  if (hour < 11) return "morning";
  if (hour < 17) return "day";
  return "evening";
}

export function TodayPage({
  date,
  profile,
  entry,
  landscape,
  restProgress,
  storageWarning,
  onGenerate,
  onReframe,
  onSwitchVariant,
  onFeedback,
  onRestProgressChange,
  getShareCaption,
}: TodayPageProps) {
  const { locale, t, formatDate } = useI18n();
  const [stage, setStage] = useState<TodayStage>(() => entry ? "reflect" : "arrive");
  const [draftCheckIn, setDraftCheckIn] = useState<DailyCheckIn>(() => entry?.checkIn ?? DEFAULT_CHECK_IN);
  const [careAction, setCareAction] = useState<CareAction | null>(() =>
    landscape?.events.find((event) => event.date === date)?.careAction ?? null,
  );
  const [confirmingReframe, setConfirmingReframe] = useState(false);
  const [restOpen, setRestOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const growthTimer = useRef<number | null>(null);
  const timeOfDay = currentTimeOfDay();
  const draftWeather = useMemo(
    () => deriveWeatherState(draftCheckIn, timeOfDay),
    [draftCheckIn, timeOfDay],
  );
  const activeVersion = entry
    ? entry.activeVariant === "reframe" && entry.reframe ? entry.reframe : entry.original
    : null;

  useEffect(() => () => {
    if (growthTimer.current !== null) window.clearTimeout(growthTimer.current);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("rest-mode-active", restOpen);
    return () => document.body.classList.remove("rest-mode-active");
  }, [restOpen]);

  if (!profile) {
    return (
      <div className="page state-page container">
        <p className="eyebrow">{t.onboarding.eyebrow}</p>
        <h1>{t.onboarding.path.title}</h1>
        <p>{t.onboarding.path.explanation}</p>
        {storageWarning && <InlineNotice tone="warning" live>{storageWarning}</InlineNotice>}
        <Link className="button button--primary" to={localizedPath("/onboarding", locale)}>
          {t.landing.primaryCta}
        </Link>
      </div>
    );
  }

  const stages: Array<{ id: Exclude<TodayStage, "grow"> | "grow" | "rest"; label: string }> = [
    { id: "arrive", label: t.today.stages.arrive },
    { id: "attune", label: t.today.stages.attune },
    { id: "tend", label: t.today.stages.tend },
    { id: "grow", label: t.today.stages.grow },
    { id: "reflect", label: t.today.stages.reflect },
    { id: "rest", label: t.today.stages.rest },
  ];
  const stageIndex = Math.max(0, stages.findIndex((item) => item.id === stage));
  const welcome = profile.displayName
    ? interpolate(t.today.arrive.welcomeNamed, { name: profile.displayName })
    : t.today.arrive.welcomeNeutral;

  const beginGrowth = () => {
    if (!careAction) {
      setNotice(t.today.tend.chooseError);
      return;
    }
    setNotice("");
    setStage("grow");
    try {
      onGenerate(draftCheckIn, careAction);
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      growthTimer.current = window.setTimeout(() => {
        setStage("reflect");
        setNotice(t.today.grow.complete);
      }, reduced ? 480 : 6_400);
    } catch {
      setStage("tend");
      setNotice(t.errors.generic);
    }
  };

  const reframe = () => {
    setConfirmingReframe(false);
    const result = onReframe();
    setNotice(result.ok ? t.today.reflect.differentNotBetter : result.message ?? t.today.reflect.reframeUsed);
  };

  const scene = (
    <LivingLandscape
      path={profile.pathNumber}
      weather={entry ? undefined : draftWeather}
      events={landscape?.events ?? []}
      activePattern={activeVersion?.configuration}
      careAction={careAction ?? undefined}
      seasonIndex={landscape?.seasonIndex ?? 0}
      locale={locale}
      restMode={restOpen}
      growthStage={restProgress.growthStage}
    />
  );

  return (
    <div className="page today-page">
      <header className="today-heading container">
        <div>
          <p className="eyebrow">{t.navigation.today} · {formatDate(date)}</p>
          <h1 className="sr-only">{t.today.pageTitle}</h1>
        </div>
        <Link
          className="profile-chip"
          to={localizedPath("/onboarding", locale)}
          aria-label={t.onboarding.editTitle}
        >
          <span>{t.result.path} {profile.pathNumber}</span>
          <strong>{profile.displayName || t.paths[profile.pathNumber].name}</strong>
          <i aria-hidden="true">↗</i>
        </Link>
      </header>

      {storageWarning && <div className="container"><InlineNotice tone="warning" live>{storageWarning}</InlineNotice></div>}
      {notice && <div className="container"><InlineNotice tone="info" live>{notice}</InlineNotice></div>}

      <div className="today-stage container">
        <ol className="experience-stepper" aria-label={t.today.stagesLabel}>
          {stages.map((item, index) => (
            <li
              key={item.id}
              className={index === stageIndex ? "is-active" : index < stageIndex ? "is-complete" : ""}
              data-step={index + 1}
              aria-current={index === stageIndex ? "step" : undefined}
            >
              {item.label}
            </li>
          ))}
        </ol>

        {(stage === "arrive" || stage === "reflect") && (
          <section className="today-stage__landscape" aria-label={t.accessibility.worldTreeTitle}>
            {scene}
            {stage === "arrive" && (
              <div className="today-stage__overlay">
                <div className="today-stage__welcome">
                  <h2>{welcome}</h2>
                  <p>{t.today.arrive.invitation}</p>
                </div>
                <button className="button button--primary" type="button" onClick={() => setStage("attune")}>
                  {t.today.arrive.cta} <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </section>
        )}

        {stage === "attune" && (
          <section className="attune-panel" aria-labelledby="attune-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t.today.attune.eyebrow}</p>
                <h2 id="attune-title">
                  {profile.displayName
                    ? interpolate(t.today.attune.titleNamed, { name: profile.displayName })
                    : t.today.attune.titleNeutral}
                </h2>
              </div>
              <p>{t.today.attune.intro}</p>
            </div>
            <AttunementField value={draftCheckIn} onChange={setDraftCheckIn} locale={locale} />
            <div className="panel-actions">
              <button className="button button--secondary" type="button" onClick={() => setStage("arrive")}>
                {t.common.back}
              </button>
              <button className="button button--primary" type="button" onClick={() => setStage("tend")}>
                {t.today.attune.continueCta} <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        )}

        {stage === "tend" && (
          <section className="tend-panel" aria-labelledby="tend-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t.today.tend.eyebrow}</p>
                <h2 id="tend-title">{t.today.tend.title}</h2>
              </div>
              <p>{t.today.tend.intro}</p>
            </div>
            <CareActionPicker value={careAction} onChange={setCareAction} locale={locale} />
            <p>{t.today.tend.noRecommendation}</p>
            <div className="panel-actions">
              <button className="button button--secondary" type="button" onClick={() => setStage("attune")}>
                {t.common.back}
              </button>
              <button className="button button--primary" type="button" onClick={beginGrowth}>
                {t.today.tend.growCta} <span aria-hidden="true">✦</span>
              </button>
            </div>
          </section>
        )}
      </div>

      {stage === "grow" && (
        <section className="growth-reveal" role="status" aria-live="polite" aria-labelledby="growth-title">
          <div className="growth-reveal__content">
            <p className="eyebrow">{t.today.grow.eyebrow}</p>
            <h2 id="growth-title">{t.today.grow.title}</h2>
            <div className="growth-reveal__line" aria-hidden="true" />
            <p>{t.today.grow.joiningLandscape}</p>
          </div>
        </section>
      )}

      {stage === "reflect" && entry && (
        <>
          <ResultView
            entry={entry}
            dateLabel={t.common.today}
            onRequestReframe={() => setConfirmingReframe(true)}
            onSwitchVariant={onSwitchVariant}
            onFeedback={onFeedback}
            shareCaption={getShareCaption(entry, entry.activeVariant)}
          />
          <section className="rest-invitation container" aria-labelledby="rest-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{t.today.rest.eyebrow}</p>
                <h2 id="rest-title">{t.today.rest.title}</h2>
              </div>
              <p>{t.today.rest.intro}</p>
            </div>
            <button className="button button--primary" type="button" onClick={() => setRestOpen(true)}>
              {t.today.rest.begin}
            </button>
          </section>
        </>
      )}

      <RestMode
        open={restOpen}
        onClose={() => setRestOpen(false)}
        locale={locale}
        progress={restProgress}
        onProgressChange={onRestProgressChange}
      >
        <LivingLandscape
          path={profile.pathNumber}
          events={landscape?.events ?? []}
          activePattern={activeVersion?.configuration}
          seasonIndex={landscape?.seasonIndex ?? 0}
          locale={locale}
          restMode
          growthStage={restProgress.growthStage}
        />
      </RestMode>

      <ConfirmDialog
        open={confirmingReframe}
        title={t.today.reflect.viewAnotherAngle}
        description={t.today.reflect.reframeExplanation}
        confirmLabel={t.today.reflect.viewAnotherAngle}
        onCancel={() => setConfirmingReframe(false)}
        onConfirm={reframe}
      />
    </div>
  );
}
