import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { interpolate, localizedPath } from "../../i18n";
import { useV3App } from "../V3App";
import { BreathingSession, type BreathingLabels } from "../components/BreathingSession";
import { DailyReading } from "../components/DailyReading";
import { RatingNineControl } from "../components/RatingNineControl";
import { V3Shell } from "../components/V3Shell";
import { WorldScene } from "../components/WorldScene";
import type { AmbientMode, CloudArchetype, RatingNine } from "../domain";
import type { CloudArchetype as SceneCloudArchetype } from "../worldData";

const SCENE_CLOUDS: Readonly<Record<CloudArchetype, SceneCloudArchetype>> = {
  "high-veils": "high",
  "layered-horizon": "layered",
  "soft-cumulus": "soft",
  "wind-drawn": "flowing",
};

type TodayNotice = "" | "saved" | "updated" | "storage-write" | "ended-early";

let fallbackSessionSequence = 0;

export function TodayPage() {
  const {
    locale,
    copy,
    state,
    todayKey,
    todayCheckIn,
    saveDailyCheckIn,
    completeDailySession,
    updateAudioPreferences,
    newLeafIndex,
  } = useV3App();
  const [mood, setMood] = useState<RatingNine | null>(() => todayCheckIn?.mood ?? null);
  const [energy, setEnergy] = useState<RatingNine | null>(() => todayCheckIn?.energy ?? null);
  const [editing, setEditing] = useState(() => todayCheckIn === null);
  const [moodError, setMoodError] = useState("");
  const [energyError, setEnergyError] = useState("");
  const [notice, setNotice] = useState<TodayNotice>("");
  const [sessionComplete, setSessionComplete] = useState(false);
  const worldRef = useRef<HTMLElement>(null);
  const activeDateRef = useRef(todayKey);

  useEffect(() => {
    if (!todayCheckIn) return;
    setMood(todayCheckIn.mood);
    setEnergy(todayCheckIn.energy);
  }, [todayCheckIn]);

  useEffect(() => {
    if (activeDateRef.current === todayKey) return;
    activeDateRef.current = todayKey;
    setMood(todayCheckIn?.mood ?? null);
    setEnergy(todayCheckIn?.energy ?? null);
    setEditing(todayCheckIn === null);
    setSessionComplete(false);
    setNotice("");
  }, [todayCheckIn, todayKey]);

  if (!state) return <Navigate replace to={localizedPath("/", locale)} />;

  const { profile, meditation } = state;
  const activeMood = todayCheckIn?.mood ?? mood ?? 5;
  const activeEnergy = todayCheckIn?.energy ?? energy ?? 5;
  const sceneDescription = todayCheckIn
    ? copy.semantics.states[todayCheckIn.derivedStateCell].visualDescription
    : copy.accessibility.bareTree;
  const treeDescription = meditation.leafCount > 0
    ? interpolate(copy.accessibility.treeWithLeaves, { count: meditation.leafCount })
    : copy.accessibility.bareTree;
  const greeting = profile.nickname
    ? interpolate(copy.daily.greetingNamed, { name: profile.nickname })
    : copy.daily.greetingNeutral;
  const noticeText = notice === "saved"
    ? copy.daily.saved
    : notice === "updated"
      ? copy.daily.updated
      : notice === "storage-write"
        ? copy.errors.storageWrite
        : notice === "ended-early"
          ? `${copy.session.endedEarly} ${copy.session.noLeaf}`
          : "";

  const submitCheckIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const missingMood = mood === null;
    const missingEnergy = energy === null;
    setMoodError(missingMood ? copy.errors.chooseMood : "");
    setEnergyError(missingEnergy ? copy.errors.chooseEnergy : "");
    if (missingMood || missingEnergy) return;

    const wasUpdate = todayCheckIn !== null;
    const saved = saveDailyCheckIn({ mood, energy, localDate: todayKey });
    if (!saved) {
      setNotice("storage-write");
      return;
    }
    setEditing(false);
    setNotice(wasUpdate ? "updated" : "saved");
  };

  const completeSession = (details: {
    durationSeconds: 60 | 300;
    ambientMode: AmbientMode;
    skipped: boolean;
  }) => {
    if (details.skipped) return;
    const completedAt = new Date();
    const result = completeDailySession({
      sessionId: createSessionId(),
      localDate: todayKey,
      durationSeconds: details.durationSeconds,
      ambientMode: details.ambientMode,
      startedAt: new Date(completedAt.getTime() - details.durationSeconds * 1000).toISOString(),
      completedAt: completedAt.toISOString(),
    });
    if (!result.added) {
      setNotice("storage-write");
      return;
    }
    setNotice("");
    setSessionComplete(true);
  };

  const breathingLabels: BreathingLabels = {
    eyebrow: copy.session.eyebrow,
    title: copy.session.title,
    subtitle: copy.session.intro,
    durationLegend: copy.session.durationLabel,
    oneMinute: copy.session.oneMinute,
    fiveMinutes: copy.session.fiveMinutes,
    soundLegend: copy.session.soundLabel,
    ocean: copy.session.ocean,
    rain: copy.session.rain,
    begin: copy.session.begin,
    skip: copy.builder.firstBreathing.skip,
    exit: copy.session.exit,
    mute: copy.session.mute,
    unmute: copy.session.unmute,
    volume: copy.session.volume,
    progress: (remaining) => interpolate(copy.session.timeRemaining, { time: remaining }),
  };

  return (
    <V3Shell>
      <div className="v3-page v3-today">
        <section className="v3-today__world" id="v3-today-world" ref={worldRef} tabIndex={-1}>
          <WorldScene
            stage="today"
            path={profile.worldPrototype}
            cloud={SCENE_CLOUDS[profile.cloudArchetype]}
            zodiac={profile.zodiacSign}
            mood={activeMood}
            energy={activeEnergy}
            leafCount={meditation.leafCount}
            newLeafIndex={newLeafIndex}
            stableSeed={profile.stableSeed}
            title={copy.accessibility.worldScene}
            description={`${sceneDescription} ${treeDescription}`}
          />
          <header className="v3-today__arrival">
            <p className="v3-eyebrow">{copy.daily.pageTitle}</p>
            <h1>{greeting}</h1>
            {!todayCheckIn && <p>{copy.daily.invitation}</p>}
          </header>
        </section>

        {noticeText && <p className="v3-status v3-today__notice" role="status">{noticeText}</p>}

        {(editing || !todayCheckIn) && (
          <section className="v3-today__check-in" aria-labelledby="v3-check-in-title">
            <h2 id="v3-check-in-title">{copy.daily.invitation}</h2>
            <form onSubmit={submitCheckIn} noValidate>
              <RatingNineControl
                name="v3-mood"
                question={copy.daily.mood.question}
                groupLabel={copy.daily.mood.groupLabel}
                lowAnchor={copy.daily.mood.lowAnchor}
                middleAnchor={copy.daily.mood.middleAnchor}
                highAnchor={copy.daily.mood.highAnchor}
                valueLabel={copy.daily.mood.valueLabel}
                instructions={copy.accessibility.scaleInstructions}
                value={mood}
                onChange={(value) => {
                  setMood(value);
                  setMoodError("");
                }}
                error={moodError}
              />
              <RatingNineControl
                name="v3-energy"
                question={copy.daily.energy.question}
                groupLabel={copy.daily.energy.groupLabel}
                lowAnchor={copy.daily.energy.lowAnchor}
                middleAnchor={copy.daily.energy.middleAnchor}
                highAnchor={copy.daily.energy.highAnchor}
                valueLabel={copy.daily.energy.valueLabel}
                instructions={copy.accessibility.scaleInstructions}
                value={energy}
                onChange={(value) => {
                  setEnergy(value);
                  setEnergyError("");
                }}
                error={energyError}
              />
              <div className="v3-actions">
                {todayCheckIn && (
                  <button className="v3-text-action" type="button" onClick={() => setEditing(false)}>
                    {copy.common.cancel}
                  </button>
                )}
                <button className="v3-primary-action" type="submit">{copy.daily.continue}</button>
              </div>
            </form>
          </section>
        )}

        {todayCheckIn && !editing && (
          <>
            <DailyReading profile={profile} checkIn={todayCheckIn} copy={copy} />
            <div className="v3-today__reading-action">
              <button className="v3-text-action" type="button" onClick={() => setEditing(true)}>
                {copy.daily.update}
              </button>
            </div>

            <section className="v3-today__breathing" aria-labelledby="v3-daily-breathing-title">
              {sessionComplete ? (
                <div className="v3-session-complete" role="status">
                  <p className="v3-session-complete__leaf" aria-hidden="true">＋1</p>
                  <p className="v3-eyebrow">{copy.session.leafGrown}</p>
                  <h2 id="v3-daily-breathing-title">{copy.session.completeTitle}</h2>
                  <p>{copy.session.completeBody}</p>
                  <button
                    className="v3-primary-action"
                    type="button"
                    onClick={() => {
                      setSessionComplete(false);
                      worldRef.current?.focus({ preventScroll: true });
                    }}
                  >
                    {copy.session.returnToWorld}
                  </button>
                </div>
              ) : (
                <BreathingSession
                  kind="daily"
                  labels={breathingLabels}
                  defaultMode={profile.preferredAmbientMode}
                  defaultMuted={meditation.audioMuted}
                  defaultVolume={meditation.audioVolume}
                  onModeChange={(preferredAmbientMode) => {
                    if (!updateAudioPreferences({ preferredAmbientMode })) {
                      setNotice("storage-write");
                    }
                  }}
                  onMutedChange={(audioMuted) => {
                    if (!updateAudioPreferences({ audioMuted })) {
                      setNotice("storage-write");
                    }
                  }}
                  onVolumeChange={(audioVolume) => {
                    if (!updateAudioPreferences({ audioVolume })) {
                      setNotice("storage-write");
                    }
                  }}
                  onComplete={completeSession}
                  onExit={() => setNotice("ended-early")}
                />
              )}
            </section>
          </>
        )}
      </div>
    </V3Shell>
  );
}

function createSessionId(): string {
  try {
    if (globalThis.crypto?.randomUUID) return `nf-v3-${globalThis.crypto.randomUUID()}`;
  } catch {
    // The monotonic local fallback remains sufficient for one browser session.
  }
  fallbackSessionSequence += 1;
  return `nf-v3-${Date.now().toString(36)}-${fallbackSessionSequence.toString(36)}`;
}
