import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { AmbientMode } from "../domain";
import { createNatureSoundscape, type NatureSoundscape } from "../audio/natureSoundscape";

gsap.registerPlugin(useGSAP);

export interface BreathingLabels {
  eyebrow: string;
  title: string;
  subtitle: string;
  durationLegend: string;
  oneMinute: string;
  fiveMinutes: string;
  soundLegend: string;
  ocean: string;
  rain: string;
  begin: string;
  skip: string;
  exit: string;
  mute: string;
  unmute: string;
  volume: string;
  progress: (remaining: string) => string;
}

interface BreathingSessionProps {
  kind: "birth" | "daily";
  labels: BreathingLabels;
  defaultMode?: AmbientMode;
  defaultMuted?: boolean;
  defaultVolume?: number;
  onModeChange?: (mode: AmbientMode) => void;
  onMutedChange?: (muted: boolean) => void;
  onVolumeChange?: (volume: number) => void;
  onProgress?: (progress: number) => void;
  onComplete: (details: { durationSeconds: 60 | 300; ambientMode: AmbientMode; skipped: boolean }) => void;
  onExit?: () => void;
  soundscapeFactory?: () => NatureSoundscape;
}

export function BreathingSession({
  kind,
  labels,
  defaultMode = "ocean",
  defaultMuted = false,
  defaultVolume = 0.32,
  onModeChange,
  onMutedChange,
  onVolumeChange,
  onProgress,
  onComplete,
  onExit,
  soundscapeFactory = createNatureSoundscape,
}: BreathingSessionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const beginRef = useRef<HTMLButtonElement>(null);
  const soundscapeRef = useRef<NatureSoundscape | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const completedRef = useRef(false);
  const callbacksRef = useRef({ onComplete, onExit, onProgress, onMutedChange, onVolumeChange });
  callbacksRef.current = { onComplete, onExit, onProgress, onMutedChange, onVolumeChange };
  const [durationSeconds, setDurationSeconds] = useState<60 | 300>(60);
  const [mode, setMode] = useState<AmbientMode>(defaultMode);
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(defaultMuted);
  const [volume, setVolume] = useState(() => normaliseSessionVolume(defaultVolume));
  const [progress, setProgress] = useState(0);
  const reducedMotion = useReducedMotion();
  const effectiveDuration = useMemo(() => {
    if (kind === "birth" && reducedMotion) return 0.9;
    return durationSeconds / readDevAcceleration();
  }, [durationSeconds, kind, reducedMotion]);

  const finish = useCallback((skipped: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    setActive(false);
    setProgress(1);
    callbacksRef.current.onProgress?.(1);
    void soundscapeRef.current?.stop();
    callbacksRef.current.onComplete({ durationSeconds, ambientMode: mode, skipped });
  }, [durationSeconds, mode]);

  const exitEarly = useCallback(async () => {
    if (completedRef.current) return;
    timelineRef.current?.kill();
    setActive(false);
    setProgress(0);
    callbacksRef.current.onProgress?.(0);
    await soundscapeRef.current?.stop();
    callbacksRef.current.onExit?.();
    window.setTimeout(() => beginRef.current?.focus(), 0);
  }, []);

  useGSAP(() => {
    if (!active) return;
    const clock = { value: 0 };
    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      onUpdate: () => {
        const next = Math.min(1, Math.max(0, clock.value));
        setProgress(next);
        callbacksRef.current.onProgress?.(next);
      },
      onComplete: () => finish(false),
    });
    timeline.addLabel("settle", 0)
      .to(clock, { value: 0.1, duration: effectiveDuration * 0.1 }, "settle")
      .addLabel("roots")
      .to(clock, { value: 0.47, duration: effectiveDuration * 0.37 }, "roots")
      .addLabel("trunk")
      .to(clock, { value: 0.84, duration: effectiveDuration * 0.37 }, "trunk")
      .addLabel("resolve")
      .to(clock, { value: 1, duration: effectiveDuration * 0.16 }, "resolve");
    timelineRef.current = timeline;
    return () => {
      timelineRef.current = null;
      timeline.kill();
    };
  }, { scope: rootRef, dependencies: [active, effectiveDuration, finish], revertOnUpdate: true });

  useEffect(() => {
    if (!active) return;
    const handleVisibility = () => {
      const hidden = document.visibilityState === "hidden";
      if (hidden) {
        timelineRef.current?.pause();
        void soundscapeRef.current?.suspend();
      } else {
        timelineRef.current?.resume();
        void soundscapeRef.current?.resume();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void exitEarly();
        return;
      }
      if (event.key !== "Tab" || !rootRef.current) return;
      const focusable = Array.from(rootRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])",
      ));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const firstControl = rootRef.current?.querySelector<HTMLElement>("button:not([disabled])");
    firstControl?.focus();
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, exitEarly]);

  useEffect(() => () => {
    void soundscapeRef.current?.destroy();
    soundscapeRef.current = null;
  }, []);

  const chooseMode = (next: AmbientMode) => {
    setMode(next);
    onModeChange?.(next);
    soundscapeRef.current?.setMode(next);
  };

  const start = async () => {
    completedRef.current = false;
    setProgress(0);
    callbacksRef.current.onProgress?.(0);
    const soundscape = soundscapeRef.current ?? soundscapeFactory();
    soundscapeRef.current = soundscape;
    await soundscape.start(mode, volume, muted);
    setActive(true);
  };

  const toggleMuted = () => {
    const next = !muted;
    setMuted(next);
    callbacksRef.current.onMutedChange?.(next);
    soundscapeRef.current?.setMuted(next);
  };

  const changeVolume = (nextValue: string) => {
    const next = normaliseSessionVolume(Number(nextValue));
    setVolume(next);
    callbacksRef.current.onVolumeChange?.(next);
    soundscapeRef.current?.setVolume(next);
  };

  const remainingSeconds = Math.max(0, Math.ceil(durationSeconds * (1 - progress)));
  const remaining = formatClock(remainingSeconds);

  return (
    <div
      className={`v3-breathing${active ? " v3-breathing--active" : ""}`}
      ref={rootRef}
      role={active ? "dialog" : undefined}
      aria-modal={active || undefined}
      aria-label={labels.title}
      data-kind={kind}
    >
      {!active ? (
        <div className="v3-breathing__setup">
          <p className="v3-eyebrow">{labels.eyebrow}</p>
          <h2>{labels.title}</h2>
          <p>{labels.subtitle}</p>
          {kind === "daily" && (
            <fieldset className="v3-choice-row">
              <legend>{labels.durationLegend}</legend>
              <button type="button" aria-pressed={durationSeconds === 60} onClick={() => setDurationSeconds(60)}>{labels.oneMinute}</button>
              <button type="button" aria-pressed={durationSeconds === 300} onClick={() => setDurationSeconds(300)}>{labels.fiveMinutes}</button>
            </fieldset>
          )}
          <fieldset className="v3-choice-row">
            <legend>{labels.soundLegend}</legend>
            <button type="button" aria-pressed={mode === "ocean"} onClick={() => chooseMode("ocean")}>{labels.ocean}</button>
            <button type="button" aria-pressed={mode === "rain"} onClick={() => chooseMode("rain")}>{labels.rain}</button>
          </fieldset>
          <div className="v3-actions">
            <button className="v3-primary-action" ref={beginRef} type="button" onClick={() => void start()}>{labels.begin}</button>
            {kind === "birth" && <button className="v3-text-action" type="button" onClick={() => finish(true)}>{labels.skip}</button>}
          </div>
        </div>
      ) : (
        <div className="v3-breathing__active">
          <p className="v3-eyebrow">{labels.eyebrow}</p>
          <p className="v3-breathing__remaining" aria-live="off">{labels.progress(remaining)}</p>
          <div className="v3-breathing__progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
          <div className="v3-breathing__quiet-controls">
            <button type="button" onClick={toggleMuted}>{muted ? labels.unmute : labels.mute}</button>
            <label className="v3-breathing__volume">
              <span>{labels.volume}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                aria-valuetext={`${Math.round(volume * 100)}%`}
                onChange={(event) => changeVolume(event.currentTarget.value)}
              />
              <output aria-hidden="true">{Math.round(volume * 100)}%</output>
            </label>
            <button type="button" onClick={() => void exitEarly()}>{labels.exit}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function readDevAcceleration(): number {
  if (!import.meta.env.DEV || typeof window === "undefined") return 1;
  const value = new URLSearchParams(window.location.search).get("qaSpeed");
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 600 ? parsed : 1;
}

function normaliseSessionVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0.32;
  return Math.min(1, Math.max(0, volume));
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}
