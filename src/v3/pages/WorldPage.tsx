import { useMemo, useState } from "react";
import type { PathNumber } from "../../domain";
import { Navigate } from "react-router-dom";
import { localizedPath } from "../../i18n";
import { useV3App } from "../V3App";
import { V3Shell } from "../components/V3Shell";
import { WorldPrototypePicker } from "../components/WorldPrototypePicker";
import { WorldScene } from "../components/WorldScene";
import type { CloudArchetype } from "../domain";
import type { V3CloudArchetypeId } from "../copy";

const CLOUD_TO_SCENE = { "high-veils": "high", "layered-horizon": "layered", "soft-cumulus": "soft", "wind-drawn": "flowing" } as const;
const COPY_TO_CLOUD: Record<V3CloudArchetypeId, CloudArchetype> = {
  thin: "high-veils", layered: "layered-horizon", soft: "soft-cumulus", flowing: "wind-drawn",
};

export function WorldPage() {
  const { locale, copy, state, redrawWorld } = useV3App();
  const [redrawing, setRedrawing] = useState(false);
  const [step, setStep] = useState<"cloud" | "world">("cloud");
  const [cloud, setCloud] = useState<CloudArchetype | null>(null);
  const [path, setPath] = useState<PathNumber | null>(null);
  const worldOptions = useMemo(() => Object.entries(copy.builder.worlds.options).map(([value, option]) => ({
    path: Number(value) as PathNumber, label: option.name, description: option.description,
  })), [copy]);
  if (!state) return <Navigate replace to={localizedPath("/", locale)} />;
  const profile = state.profile;
  const activeCloud = cloud ?? profile.cloudArchetype;
  const activePath = path ?? profile.worldPrototype;
  const zh = locale === "zh-CN";

  const reset = () => { setRedrawing(false); setStep("cloud"); setCloud(null); setPath(null); };
  return <V3Shell>
    <article className="v3-page v3-world-page">
      <header><p className="v3-eyebrow">{zh ? "我的九境" : "My Ninefold"}</p><h1>{zh ? "你的世界" : "Your world"}</h1><p>{zh ? "树叶与记录会留在原处。" : "Your leaves and records remain exactly as they are."}</p></header>
      <WorldScene stage="today" path={activePath} cloud={CLOUD_TO_SCENE[activeCloud]} zodiac={profile.zodiacSign} leafCount={state.meditation.leafCount} stableSeed={profile.stableSeed} title={copy.accessibility.worldScene} description={copy.accessibility.bareTree} />
      {!redrawing ? <button className="v3-primary-action" type="button" onClick={() => setRedrawing(true)}>{zh ? "重绘世界" : "Redraw world"}</button> :
        <section className="v3-redraw" aria-labelledby="v3-redraw-title">
          <h2 id="v3-redraw-title">{zh ? "重绘世界" : "Redraw your world"}</h2>
          {step === "cloud" ? <>
            <fieldset className="v3-cloud-grid"><legend>{copy.builder.clouds.question}</legend>{Object.entries(copy.builder.clouds.options).map(([id, option]) => { const value = COPY_TO_CLOUD[id as V3CloudArchetypeId]; return <label key={id}><input type="radio" name="redraw-cloud" checked={cloud === value} onChange={() => setCloud(value)} /> <strong>{option.name}</strong><span>{option.description}</span></label>; })}</fieldset>
            <div className="v3-actions"><button className="v3-text-action" type="button" onClick={reset}>{copy.common.cancel}</button><button className="v3-primary-action" type="button" disabled={!cloud} onClick={() => setStep("world")}>{copy.common.continue}</button></div>
          </> : <>
            <WorldPrototypePicker legend={copy.builder.worlds.groupLabel} options={worldOptions} value={path} onChange={setPath} onPreview={() => {}} />
            <div className="v3-actions"><button className="v3-text-action" type="button" onClick={() => setStep("cloud")}>{zh ? "返回" : "Back"}</button><button className="v3-text-action" type="button" onClick={reset}>{copy.common.cancel}</button><button className="v3-primary-action" type="button" disabled={!path} onClick={() => { if (path && cloud && redrawWorld(cloud, path)) reset(); }}>{zh ? "确认重绘" : "Confirm redraw"}</button></div>
          </>}
        </section>}
    </article>
  </V3Shell>;
}
