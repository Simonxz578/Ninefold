import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  createAmbientSoundscape,
  type AmbientSoundscape,
  type AmbientSoundscapeFactory,
} from "../../audio/ambientSoundscape";
import {
  advanceRestSession,
  DEFAULT_REST_SESSION_PROGRESS,
  updateRestAudioPreferences,
  type GrowthStage,
  type RestSessionProgress,
} from "../../domain/restSession";
import type { LandscapeLocale } from "../../domain/types";
import { dictionaries, interpolate, type TranslationDictionary } from "../../i18n";
import "../../living-world.css";
import { sanitiseSvgId } from "./geometry";

export type RestDuration = 30 | 60 | 300 | "open";
export type RestSessionPhase = "setup" | "active" | "growth" | "complete";

export const REST_GROWTH_DURATION_MS = 16_000;
export const REST_GROWTH_REDUCED_DURATION_MS = 900;
const REST_GROWTH_STEP_DURATION_MS = 30_000;
const REST_GROWTH_STEP_MAX = 10;

export interface RestModeProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  locale?: LandscapeLocale;
  initialDuration?: RestDuration;
  durations?: readonly RestDuration[];
  onDurationChange?: (duration: RestDuration) => void;
  progress?: RestSessionProgress;
  onProgressChange?: (progress: RestSessionProgress) => void;
  audioFactory?: AmbientSoundscapeFactory;
}

const DEFAULT_DURATIONS: readonly RestDuration[] = [30, 60, 300, "open"];

export function RestMode({
  open,
  onClose,
  children,
  locale = "en",
  initialDuration = 300,
  durations = DEFAULT_DURATIONS,
  onDurationChange,
  progress,
  onProgressChange,
  audioFactory = createAmbientSoundscape,
}: RestModeProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const exitRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const onProgressChangeRef = useRef(onProgressChange);
  const audioFactoryRef = useRef(audioFactory);
  const soundscapeRef = useRef<AmbientSoundscape | null>(null);
  const sessionStartedAtRef = useRef(0);
  const completionAwardedRef = useRef(false);
  const [duration, setDuration] = useState<RestDuration>(initialDuration);
  const [phase, setPhase] = useState<RestSessionPhase>("setup");
  const [now, setNow] = useState(() => Date.now());
  const [reducedMotion, setReducedMotion] = useState(false);
  const [enteringStage, setEnteringStage] = useState<GrowthStage>(0);
  const [renewal, setRenewal] = useState(false);
  const [retainedGrowthStep, setRetainedGrowthStep] = useState(0);
  const [sessionProgress, setSessionProgress] = useState<RestSessionProgress>(
    () => progress ?? { ...DEFAULT_REST_SESSION_PROGRESS },
  );
  const progressRef = useRef(sessionProgress);
  const id = `nf-rest-${sanitiseSvgId(useId())}`;
  const copy = dictionaries[locale].landscape.restMode;

  useEffect(() => {
    onCloseRef.current = onClose;
    onProgressChangeRef.current = onProgressChange;
    audioFactoryRef.current = audioFactory;
  }, [audioFactory, onClose, onProgressChange]);

  useEffect(() => {
    if (!progress) return;
    progressRef.current = progress;
    setSessionProgress(progress);
  }, [progress]);

  useLayoutEffect(() => {
    if (!open) return;
    setPhase("setup");
    setDuration(initialDuration);
    setNow(Date.now());
    setEnteringStage(0);
    setRenewal(false);
    setRetainedGrowthStep(0);
    completionAwardedRef.current = false;
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setReducedMotion(prefersReducedMotion);
  }, [initialDuration, open]);

  useEffect(() => {
    if (!open) {
      void soundscapeRef.current?.stop();
      return undefined;
    }

    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []);
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open || phase !== "active") return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [open, phase]);

  const elapsedMilliseconds = phase === "active"
    ? Math.max(0, now - sessionStartedAtRef.current)
    : 0;
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMilliseconds / 1000));
  const activeGrowthStep = Math.min(
    REST_GROWTH_STEP_MAX,
    Math.floor(elapsedMilliseconds / REST_GROWTH_STEP_DURATION_MS),
  );
  const totalSeconds = duration === "open" ? null : duration;
  const remainingSeconds = totalSeconds === null
    ? null
    : Math.max(0, Math.ceil((totalSeconds * 1000 - elapsedMilliseconds) / 1000));

  useEffect(() => {
    if (
      !open ||
      phase !== "active" ||
      duration === "open" ||
      elapsedMilliseconds < duration * 1000 ||
      completionAwardedRef.current
    ) {
      return;
    }

    completionAwardedRef.current = true;
    const previous = progressRef.current;
    const next = advanceRestSession(previous, duration, new Date().toISOString());
    const nextStage = next.growthStage;
    progressRef.current = next;
    setSessionProgress(next);
    onProgressChangeRef.current?.(next);
    setEnteringStage(nextStage);
    setRenewal(previous.growthStage === 5);
    setRetainedGrowthStep(activeGrowthStep);
    setPhase("growth");
    soundscapeRef.current?.beginGrowth();
  }, [activeGrowthStep, duration, elapsedMilliseconds, open, phase]);

  useEffect(() => {
    if (!open || phase !== "growth") return undefined;
    const completionTimer = window.setTimeout(() => {
      soundscapeRef.current?.complete();
      setPhase("complete");
    }, reducedMotion ? REST_GROWTH_REDUCED_DURATION_MS : REST_GROWTH_DURATION_MS);
    return () => window.clearTimeout(completionTimer);
  }, [open, phase, reducedMotion]);

  useEffect(() => {
    if (!open || phase === "setup") return undefined;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void soundscapeRef.current?.suspend();
      } else {
        void soundscapeRef.current?.resume();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [open, phase]);

  useEffect(() => () => {
    void soundscapeRef.current?.destroy();
    soundscapeRef.current = null;
  }, []);

  if (!open) return null;

  function getSoundscape(): AmbientSoundscape | null {
    if (soundscapeRef.current) return soundscapeRef.current;
    try {
      soundscapeRef.current = audioFactoryRef.current();
      return soundscapeRef.current;
    } catch {
      return null;
    }
  }

  function requestClose() {
    void soundscapeRef.current?.stop();
    setPhase("setup");
    onCloseRef.current();
  }

  const selectDuration = (nextDuration: RestDuration) => {
    setDuration(nextDuration);
    onDurationChange?.(nextDuration);
  };

  const startRest = () => {
    completionAwardedRef.current = false;
    const startedAt = Date.now();
    sessionStartedAtRef.current = startedAt;
    setNow(startedAt);
    setEnteringStage(0);
    setRenewal(false);
    setRetainedGrowthStep(0);
    setPhase("active");
    const soundscape = getSoundscape();
    void soundscape?.start(sessionProgress.audioVolume, sessionProgress.audioMuted);
    window.setTimeout(() => exitRef.current?.focus({ preventScroll: true }), 0);
  };

  const toggleMuted = () => {
    const next = updateRestAudioPreferences(progressRef.current, {
      audioMuted: !sessionProgress.audioMuted,
    });
    progressRef.current = next;
    setSessionProgress(next);
    onProgressChangeRef.current?.(next);
    soundscapeRef.current?.setMuted(next.audioMuted);
  };

  const changeVolume = (value: number) => {
    const next = updateRestAudioPreferences(progressRef.current, { audioVolume: value });
    progressRef.current = next;
    setSessionProgress(next);
    onProgressChangeRef.current?.(next);
    soundscapeRef.current?.setVolume(next.audioVolume);
  };

  const displaySeconds = remainingSeconds ?? elapsedSeconds;
  const minutesDisplay = Math.floor(displaySeconds / 60);
  const secondsDisplay = displaySeconds % 60;
  const formattedTime = `${minutesDisplay}:${secondsDisplay.toString().padStart(2, "0")}`;
  const timerProgress = totalSeconds === null
    ? 100
    : Math.round(((remainingSeconds ?? totalSeconds) / totalSeconds) * 100);
  const restGrowthStep = phase === "active"
    ? activeGrowthStep
    : phase === "growth" || phase === "complete"
      ? retainedGrowthStep
      : 0;
  const phaseClassName = [
    "rest-mode",
    `rest-mode--${phase}`,
    phase === "growth" ? `rest-mode--entering-${enteringStage}` : "",
    renewal ? "rest-mode--renewal" : "",
    reducedMotion ? "rest-mode--reduced" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={phaseClassName}
      role="presentation"
      data-phase={phase}
      data-entering-stage={phase === "growth" ? enteringStage : undefined}
      data-growth-stage={sessionProgress.growthStage}
      data-rest-growth-step={restGrowthStep}
    >
      <section
        ref={dialogRef}
        className="rest-mode__dialog"
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        tabIndex={-1}
      >
        <div className="rest-mode__landscape">{children}</div>

        {phase === "setup" ? (
          <div className="rest-mode__controls rest-mode__controls--setup">
            <div>
              <p className="rest-mode__eyebrow">{copy.eyebrow}</p>
              <h2>{copy.title}</h2>
              <p>{copy.description}</p>
            </div>
            <fieldset className="rest-mode__durations">
              <legend>{copy.duration}</legend>
              {durations.map((durationOption) => (
                <button
                  key={durationOption}
                  type="button"
                  className={durationOption === duration ? "is-active" : ""}
                  aria-pressed={durationOption === duration}
                  onClick={() => selectDuration(durationOption)}
                >
                  {durationLabel(durationOption, copy)}
                </button>
              ))}
            </fieldset>
            <AudioControls
              id={id}
              copy={copy}
              muted={sessionProgress.audioMuted}
              volume={sessionProgress.audioVolume}
              onToggleMuted={toggleMuted}
              onVolumeChange={changeVolume}
              showVolume
            />
            <p className="rest-mode__status">{copy.escape}</p>
            <div className="rest-mode__actions">
              <button className="rest-mode__start" type="button" onClick={startRest}>
                {copy.start}
              </button>
              <button ref={closeRef} className="rest-mode__close" type="button" onClick={requestClose}>
                {copy.close}
              </button>
            </div>
          </div>
        ) : (
          <div className={`rest-mode__hud rest-mode__hud--${phase}`}>
            <div
              className="rest-mode__hud-copy"
              role={phase === "active" ? undefined : "status"}
              aria-live={phase === "active" ? undefined : "polite"}
            >
              <p className="rest-mode__eyebrow">{copy.eyebrow}</p>
              <p className="rest-mode__phase-label">
                {phase === "active"
                  ? copy.activeStatus
                  : phase === "growth"
                    ? copy.growthStatus
                    : copy.completeTitle}
              </p>
              {phase === "complete" && <p className="rest-mode__complete-copy">{copy.complete}</p>}
            </div>
            {phase === "active" && (
              <div
                className={`rest-mode__timer${duration === "open" ? " rest-mode__timer--open" : ""}`}
                role="timer"
                aria-label={duration === "open"
                  ? interpolate(copy.openTimerLabel, { label: copy.openEnded, time: formattedTime })
                  : formattedTime}
                style={{ "--nf-rest-progress": `${timerProgress}%` } as CSSProperties}
              >
                <span aria-hidden="true">{formattedTime}</span>
              </div>
            )}
            {phase === "growth" && <span className="rest-mode__growth-mark" aria-hidden="true">✦</span>}
            <div className="rest-mode__hud-actions">
              <AudioControls
                id={`${id}-compact`}
                copy={copy}
                muted={sessionProgress.audioMuted}
                volume={sessionProgress.audioVolume}
                onToggleMuted={toggleMuted}
                onVolumeChange={changeVolume}
              />
              <button ref={exitRef} className="rest-mode__close" type="button" onClick={requestClose}>
                {copy.exit}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

interface AudioControlsProps {
  id: string;
  copy: TranslationDictionary["landscape"]["restMode"];
  muted: boolean;
  volume: number;
  onToggleMuted: () => void;
  onVolumeChange: (value: number) => void;
  showVolume?: boolean;
}

function AudioControls({
  id,
  copy,
  muted,
  volume,
  onToggleMuted,
  onVolumeChange,
  showVolume = false,
}: AudioControlsProps) {
  return (
    <div className={`rest-mode__audio${showVolume ? " rest-mode__audio--expanded" : ""}`}>
      <button
        className="rest-mode__audio-toggle"
        type="button"
        onClick={onToggleMuted}
      >
        <span aria-hidden="true">{muted ? "◌" : "♪"}</span>
        <span>{muted ? copy.unmute : copy.mute}</span>
      </button>
      {showVolume && (
        <label className="rest-mode__volume" htmlFor={`${id}-volume`}>
          <span>{copy.volume}</span>
          <input
            id={`${id}-volume`}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.currentTarget.value))}
          />
        </label>
      )}
    </div>
  );
}

function durationLabel(
  duration: RestDuration,
  copy: TranslationDictionary["landscape"]["restMode"],
): string {
  if (duration === 30) return copy.thirtySeconds;
  if (duration === 60) return copy.oneMinute;
  if (duration === 300) return copy.fiveMinutes;
  return copy.openEnded;
}
