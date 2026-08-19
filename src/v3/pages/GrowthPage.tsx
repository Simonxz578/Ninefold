import { Navigate } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import { formatDateForLocale, interpolate, localizedPath } from "../../i18n";
import { useV3App } from "../V3App";
import { V3Shell } from "../components/V3Shell";
import { WorldScene } from "../components/WorldScene";
const GrowthCalendar = lazy(() => import("../components/GrowthCalendar").then((module) => ({ default: module.GrowthCalendar })));
import type { CloudArchetype } from "../domain";
import type { CloudArchetype as SceneCloudArchetype } from "../worldData";

const SCENE_CLOUDS: Readonly<Record<CloudArchetype, SceneCloudArchetype>> = {
  "high-veils": "high",
  "layered-horizon": "layered",
  "soft-cumulus": "soft",
  "wind-drawn": "flowing",
};

export function GrowthPage() {
  const { locale, copy, state, todayCheckIn, newLeafIndex } = useV3App();
  const [view, setView] = useState<"tree" | "calendar">("tree");

  if (!state) return <Navigate replace to={localizedPath("/", locale)} />;

  const { profile, meditation } = state;
  const recentSessions = [...meditation.sessions].reverse().slice(0, 7);
  const totalMinutes = meditation.totalCompletedSeconds / 60;
  const sceneDescription = meditation.leafCount > 0
    ? interpolate(copy.accessibility.treeWithLeaves, { count: meditation.leafCount })
    : copy.accessibility.bareTree;

  return (
    <V3Shell>
      <article className="v3-page v3-growth">
        <header className="v3-growth__header">
          <p className="v3-eyebrow">{copy.growth.eyebrow}</p>
          <h1>{copy.growth.title}</h1>
          <p>{copy.growth.intro}</p>
        </header>

        <div className="v3-growth__switch" role="group" aria-label={locale === "zh-CN" ? "生长视图" : "Growth view"}>
          <button type="button" aria-pressed={view === "tree"} onClick={() => setView("tree")}>{locale === "zh-CN" ? "树" : "Tree"}</button>
          <button type="button" aria-pressed={view === "calendar"} onClick={() => setView("calendar")}>{locale === "zh-CN" ? "日历" : "Calendar"}</button>
        </div>

        {view === "calendar" ? <Suspense fallback={<p role="status">{locale === "zh-CN" ? "正在打开日历…" : "Opening calendar…"}</p>}><GrowthCalendar state={state} locale={locale} /></Suspense> : <>

        <section className="v3-growth__world" aria-labelledby="v3-growth-tree-heading">
          <h2 className="sr-only" id="v3-growth-tree-heading">{copy.growth.treeHeading}</h2>
          <WorldScene
            stage="today"
            path={profile.worldPrototype}
            cloud={SCENE_CLOUDS[profile.cloudArchetype]}
            zodiac={profile.zodiacSign}
            mood={todayCheckIn?.mood ?? 5}
            energy={todayCheckIn?.energy ?? 5}
            leafCount={meditation.leafCount}
            newLeafIndex={newLeafIndex}
            stableSeed={profile.stableSeed}
            title={copy.accessibility.worldScene}
            description={sceneDescription}
          />
        </section>

        <dl className="v3-growth__summary" aria-label={copy.growth.treeHeading}>
          <div>
            <dt>{interpolate(copy.growth.leafCount, { count: meditation.leafCount })}</dt>
            <dd aria-hidden="true">{meditation.leafCount}</dd>
          </div>
          <div>
            <dt>{interpolate(copy.growth.sessionCount, { count: meditation.totalCompletedSessions })}</dt>
            <dd aria-hidden="true">{meditation.totalCompletedSessions}</dd>
          </div>
          <div>
            <dt>{interpolate(copy.growth.totalMinutes, { minutes: totalMinutes })}</dt>
            <dd aria-hidden="true">{totalMinutes}</dd>
          </div>
        </dl>

        <aside className="v3-growth__meaning">
          <p>{copy.growth.oneLeafMeaning}</p>
          <p>{copy.growth.noStreaks}</p>
        </aside>

        <section className="v3-growth__history" aria-labelledby="v3-growth-history-heading">
          <h2 id="v3-growth-history-heading">{copy.growth.recentSessions}</h2>
          {recentSessions.length === 0 ? (
            <div className="v3-growth__empty">
              <h3>{copy.growth.noSessionsTitle}</h3>
              <p>{copy.growth.noSessionsBody}</p>
            </div>
          ) : (
            <ol className="v3-growth__sessions">
              {recentSessions.map((session) => (
                <li key={session.sessionId}>
                  <time dateTime={session.localDate}>
                    {formatDateForLocale(session.localDate, locale, "monthDay")}
                  </time>
                  <span>{session.durationSeconds === 60 ? copy.session.oneMinute : copy.session.fiveMinutes}</span>
                  <span>{session.ambientMode === "ocean" ? copy.session.ocean : copy.session.rain}</span>
                  <span aria-label={interpolate(copy.accessibility.leafCount, { count: 1 })}>＋1</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        </>}
      </article>
    </V3Shell>
  );
}
