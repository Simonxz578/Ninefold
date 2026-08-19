import { useId, type CSSProperties } from "react";
import { TREE_GEOMETRY } from "../../components/landscape/WorldTree";
import { PATH_NUMBERS, type PathNumber, type ZodiacSign } from "../../domain";
import { getLeafPlacement } from "../domain";
import {
  CLOUD_ARCHETYPES,
  V3_TREE_BRANCHLETS,
  WORLD_TERRAINS,
  ZODIAC_MOTIFS,
  type CloudArchetype,
} from "../worldData";

export type WorldSceneStage =
  | "sky"
  | "zodiac"
  | "cloud"
  | "prototype"
  | "terrain"
  | "seed"
  | "birth"
  | "bare"
  | "today";

export interface WorldSceneProps {
  stage: WorldSceneStage;
  path?: PathNumber | null;
  cloud?: CloudArchetype | null;
  zodiac?: ZodiacSign | null;
  mood?: number;
  energy?: number;
  leafCount?: number;
  newLeafIndex?: number | null;
  birthProgress?: number;
  stableSeed?: string;
  title?: string;
  description?: string;
  className?: string;
  decorative?: boolean;
  compact?: boolean;
}

const STAGE_ORDER: Readonly<Record<WorldSceneStage, number>> = {
  sky: 0,
  zodiac: 1,
  cloud: 2,
  prototype: 3,
  terrain: 3,
  seed: 4,
  birth: 5,
  bare: 6,
  today: 7,
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const progressBetween = (progress: number, start: number, end: number): number =>
  clamp((progress - start) / (end - start), 0, 1);

function mixHex(from: string, to: string, amount: number): string {
  const ratio = clamp(amount, 0, 1);
  const fromValue = Number.parseInt(from.slice(1), 16);
  const toValue = Number.parseInt(to.slice(1), 16);
  const channel = (shift: number) => Math.round(
    ((fromValue >> shift) & 0xff) * (1 - ratio) + ((toValue >> shift) & 0xff) * ratio,
  );
  return `rgb(${channel(16)} ${channel(8)} ${channel(0)})`;
}

function safeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

export function WorldScene({
  stage,
  path = null,
  cloud = null,
  zodiac = null,
  mood = 5,
  energy = 5,
  leafCount = 0,
  newLeafIndex = null,
  birthProgress = 0,
  stableSeed,
  title = "Ninefold world",
  description = "A calm symbolic landscape shaped by your choices.",
  className = "",
  decorative = false,
  compact = false,
}: WorldSceneProps) {
  const reactId = useId();
  const idPrefix = `v3-world-${safeSvgId(reactId)}`;
  const stageNumber = STAGE_ORDER[stage];
  const moodUnit = (clamp(mood, 1, 9) - 1) / 8;
  const energyUnit = (clamp(energy, 1, 9) - 1) / 8;
  const skyTop = mixHex("#668ca3", "#55b9df", moodUnit);
  const skyHorizon = mixHex("#d9e8e2", "#ffe6ad", moodUnit);
  const sunOpacity = 0.34 + moodUnit * 0.46;
  const hasTerrain = stageNumber >= STAGE_ORDER.prototype && path !== null;
  const showGhostTree = (stage === "prototype" || stage === "terrain") && path !== null;
  const showTree = (stage === "birth" || stage === "bare" || stage === "today") && path !== null;
  const showSeed = (stage === "seed" || stage === "birth") && path !== null;
  const resolvedBirthProgress = stage === "birth"
    ? clamp(birthProgress, 0, 1)
    : showTree || showGhostTree
      ? 1
      : 0;
  const sceneStyle = {
    "--v3-world-energy": energyUnit,
    "--v3-cloud-drift-duration": `${34 - energyUnit * 16}s`,
  } as CSSProperties;
  const terrainPaths = compact && path !== null ? [path] : PATH_NUMBERS;

  return (
    <figure
      className={`v3-world-scene v3-world-scene--${stage} ${className}`.trim()}
      data-stage={stage}
      data-path={path ?? undefined}
      data-cloud={cloud ?? undefined}
      data-zodiac={zodiac ?? undefined}
      data-mood={clamp(Math.round(mood), 1, 9)}
      data-energy={clamp(Math.round(energy), 1, 9)}
      style={sceneStyle}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : `${idPrefix}-title`}
      aria-describedby={decorative ? undefined : `${idPrefix}-description`}
    >
      {!decorative && (
        <figcaption className="v3-world-scene__caption sr-only">
          <span id={`${idPrefix}-title`}>{title}</span>
          <span id={`${idPrefix}-description`}>{description}</span>
        </figcaption>
      )}
      <svg
        className="v3-world-scene__svg"
        viewBox="0 0 1200 720"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`${idPrefix}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={skyTop} />
            <stop offset="1" stopColor={skyHorizon} />
          </linearGradient>
          <radialGradient id={`${idPrefix}-sun`}>
            <stop offset="0" stopColor="#fffce8" stopOpacity=".96" />
            <stop offset=".28" stopColor="#ffe39a" stopOpacity=".54" />
            <stop offset="1" stopColor="#f3ca72" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${idPrefix}-water`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9ad8dc" stopOpacity=".78" />
            <stop offset="1" stopColor="#4f8e98" stopOpacity=".94" />
          </linearGradient>
          <linearGradient id={`${idPrefix}-wood`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#234c40" />
            <stop offset=".58" stopColor="#477b61" />
            <stop offset="1" stopColor="#91a66e" />
          </linearGradient>
          <radialGradient id={`${idPrefix}-seed`}>
            <stop offset="0" stopColor="#fff5ae" />
            <stop offset=".5" stopColor="#9eb96e" />
            <stop offset="1" stopColor="#355f4b" />
          </radialGradient>
        </defs>

        <g className="v3-world-scene__sky">
          <rect width="1200" height="720" fill={`url(#${idPrefix}-sky)`} />
          <circle
            className="v3-world-scene__sun"
            cx="780"
            cy="112"
            r="146"
            fill={`url(#${idPrefix}-sun)`}
            opacity={sunOpacity}
          />
          <path
            className="v3-world-scene__high-haze"
            d="M0 310C210 254 410 290 592 272C806 250 1000 270 1200 228V430H0Z"
            fill="#f5f6dc"
            opacity={0.1 + moodUnit * 0.08}
          />
        </g>

        {zodiac && stageNumber >= STAGE_ORDER.zodiac && (
          <ZodiacLayer zodiac={zodiac} />
        )}

        {stageNumber >= STAGE_ORDER.cloud && (
          <CloudLayer selected={cloud} energyUnit={energyUnit} />
        )}

        {hasTerrain && (
          <g className="v3-world-scene__terrains">
            {terrainPaths.map((terrainPath) => (
              <TerrainLayer
                key={terrainPath}
                path={terrainPath}
                active={terrainPath === path}
                waterGradientId={`${idPrefix}-water`}
              />
            ))}
          </g>
        )}

        {showSeed && (
          <SeedLayer
            gradientId={`${idPrefix}-seed`}
            birthProgress={stage === "birth" ? resolvedBirthProgress : 0}
          />
        )}

        {showGhostTree && path !== null && (
          <BareTreeLayer
            idPrefix={`${idPrefix}-ghost`}
            path={path}
            progress={1}
            ghost
          />
        )}

        {showTree && path !== null && (
          <BareTreeLayer
            idPrefix={idPrefix}
            path={path}
            progress={resolvedBirthProgress}
            woodGradientId={`${idPrefix}-wood`}
          />
        )}

        {stage === "today" && path !== null && leafCount > 0 && (
          <LeafLayer
            count={leafCount}
            newLeafIndex={newLeafIndex}
            path={path}
            stableSeed={stableSeed ?? `ninefold-path-${path}`}
          />
        )}

        <g className="v3-world-scene__foreground" opacity={hasTerrain ? 1 : 0}>
          <path d="M0 690C218 656 406 688 600 670C804 652 1016 668 1200 642V720H0Z" fill="#244d3e" opacity=".42" />
        </g>
      </svg>
    </figure>
  );
}

function ZodiacLayer({ zodiac }: { zodiac: ZodiacSign }) {
  const motif = ZODIAC_MOTIFS[zodiac];
  return (
    <g className={`v3-zodiac v3-zodiac--${zodiac}`} data-zodiac={zodiac}>
      <g className="v3-zodiac__lines" fill="none" stroke="#fffce5" strokeWidth="1.6" opacity=".46">
        {motif.links.map(([from, to]) => {
          const start = motif.points[from];
          const end = motif.points[to];
          if (!start || !end) return null;
          return <line key={`${from}-${to}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} />;
        })}
      </g>
      <g className="v3-zodiac__stars" fill="#fffde2">
        {motif.points.map((point, index) => (
          <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r={point.r ?? (index % 3 === 0 ? 2.2 : 1.5)} />
        ))}
      </g>
    </g>
  );
}

function CloudLayer({
  selected,
  energyUnit,
}: {
  selected: CloudArchetype | null;
  energyUnit: number;
}) {
  return (
    <g className="v3-clouds" data-cloud={selected ?? undefined}>
      {(Object.keys(CLOUD_ARCHETYPES) as CloudArchetype[]).map((archetype) => {
        const definition = CLOUD_ARCHETYPES[archetype];
        const active = archetype === selected;
        return (
          <g
            className={`v3-clouds__archetype v3-clouds__archetype--${archetype}`}
            data-active={active || undefined}
            key={archetype}
            fill="#fffdf5"
            opacity={active ? definition.opacity : 0}
            style={{
              transition: "opacity 420ms cubic-bezier(.2, 0, 0, 1)",
              "--v3-cloud-speed": `${definition.speedFactor * (0.8 + energyUnit * 0.4)}`,
            } as CSSProperties}
          >
            {definition.paths.map((d) => <path d={d} key={d} />)}
          </g>
        );
      })}
    </g>
  );
}

function TerrainLayer({
  path,
  active,
  waterGradientId,
}: {
  path: PathNumber;
  active: boolean;
  waterGradientId: string;
}) {
  const terrain = WORLD_TERRAINS[path];
  return (
    <g
      className={`v3-terrain v3-terrain--path-${path}`}
      data-path={path}
      data-active={active || undefined}
      opacity={active ? 1 : 0}
      style={{ transition: "opacity 480ms cubic-bezier(.2, 0, 0, 1)" }}
    >
      <path className="v3-terrain__far" d={terrain.farRidge} fill="#668f7b" opacity=".64" />
      <path className="v3-terrain__water" d={terrain.water} fill={`url(#${waterGradientId})`} />
      <path className="v3-terrain__near" d={terrain.nearLand} fill="#4f8057" />
      <g className="v3-terrain__details">
        {terrain.details.map((detail) => (
          <path
            d={detail.d}
            key={detail.d}
            fill={detail.kind === "fill" ? "#e5d88a" : "none"}
            stroke={detail.kind === "line" ? "#c9de8b" : "none"}
            strokeWidth={detail.kind === "line" ? 4 : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity=".74"
          />
        ))}
      </g>
    </g>
  );
}

function SeedLayer({
  gradientId,
  birthProgress,
}: {
  gradientId: string;
  birthProgress: number;
}) {
  const settle = progressBetween(birthProgress, 0, 0.26);
  const fade = 1 - progressBetween(birthProgress, 0.27, 0.43);
  return (
    <g
      className="v3-seed"
      data-birth-progress={birthProgress.toFixed(3)}
      transform={`translate(600 ${570 + settle * 14}) scale(${0.9 + settle * 0.1})`}
      opacity={fade}
    >
      <ellipse cx="0" cy="0" rx="13" ry="19" fill={`url(#${gradientId})`} transform="rotate(18)" />
      <path d="M-1-12C8-24 18-25 24-23C15-14 8-10-1-12Z" fill="#dce69a" opacity=".8" />
    </g>
  );
}

function BareTreeLayer({
  idPrefix,
  path,
  progress,
  woodGradientId,
  ghost = false,
}: {
  idPrefix: string;
  path: PathNumber;
  progress: number;
  woodGradientId?: string;
  ghost?: boolean;
}) {
  const geometry = TREE_GEOMETRY[path];
  const branchlets = V3_TREE_BRANCHLETS[path];
  const trunks = geometry.trunkSegments ?? [geometry.trunk];
  const rootsProgress = progressBetween(progress, 0.25, 0.46);
  const trunkProgress = progressBetween(progress, 0.4, 0.72);
  return (
    <g
      className={`v3-world-tree v3-world-tree--path-${path}${ghost ? " v3-world-tree--ghost" : ""}`}
      data-path={path}
      data-tree-state={ghost ? "ghost" : progress >= 1 ? "bare" : "birthing"}
      opacity={ghost ? 0.22 : 1}
    >
      <g className="v3-world-tree__roots" fill="none" stroke={ghost ? "#eef2cf" : "#315f4d"} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round">
        {geometry.roots.map((d, index) => {
          const partProgress = progressBetween(rootsProgress, index * 0.12, 0.72 + index * 0.08);
          return <path d={d} key={d} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - partProgress} />;
        })}
      </g>
      {!ghost && (
        <g className="v3-world-tree__trunk-shadows" fill="none" stroke="#173e38" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round" opacity=".5">
          {trunks.map((d) => <path d={d} key={`${idPrefix}-shadow-${d}`} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - trunkProgress} />)}
        </g>
      )}
      <g
        className="v3-world-tree__trunks"
        fill="none"
        stroke={ghost ? "#f3f3d9" : `url(#${woodGradientId})`}
        strokeWidth={ghost ? 22 : 29}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {trunks.map((d) => <path d={d} key={`${idPrefix}-trunk-${d}`} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - trunkProgress} />)}
      </g>
      <g className="v3-world-tree__branches" fill="none" stroke={ghost ? "#f3f3d9" : "#477b61"} strokeWidth={ghost ? 11 : 14} strokeLinecap="round" strokeLinejoin="round">
        {geometry.branches.map((d, index) => {
          const span = Math.max(geometry.branches.length - 1, 1);
          const start = 0.54 + (index / span) * 0.18;
          const branchProgress = progressBetween(progress, start, Math.min(start + 0.2, 0.92));
          return <path d={d} key={d} pathLength="1" strokeDasharray="1" strokeDashoffset={1 - branchProgress} />;
        })}
        <g
          className="v3-world-tree__branchlets"
          stroke={ghost ? "#f3f3d9" : "#62876b"}
          strokeWidth={ghost ? 6 : 7.5}
        >
          {branchlets.map((d, index) => {
            const span = Math.max(branchlets.length - 1, 1);
            const start = 0.72 + (index / span) * 0.1;
            const branchletProgress = progressBetween(progress, start, Math.min(start + 0.16, 1));
            return (
              <path
                d={d}
                key={`${idPrefix}-branchlet-${index}`}
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1 - branchletProgress}
              />
            );
          })}
        </g>
      </g>
    </g>
  );
}

function LeafLayer({
  path,
  count,
  newLeafIndex,
  stableSeed,
}: {
  path: PathNumber;
  count: number;
  newLeafIndex: number | null;
  stableSeed: string;
}) {
  const safeCount = clamp(Math.floor(count), 0, 500);
  return (
    <g className="v3-world-leaves" data-leaf-count={safeCount}>
      {Array.from({ length: safeCount }, (_, index) => {
        const placement = getLeafPlacement(stableSeed, path, index);
        const isNew = index === newLeafIndex;
        return (
          <g
            className={`v3-world-leaf${isNew ? " v3-world-leaf--new" : ""}`}
            data-leaf-index={index}
            data-new={isNew || undefined}
            key={`${stableSeed}-${index}`}
            transform={`translate(${placement.x} ${placement.y}) rotate(${placement.rotation})`}
          >
            <g transform={`scale(${placement.scale})`}>
              <circle className="v3-world-leaf__bud" r="3.4" fill="#eaf0a4" />
              <path
                className="v3-world-leaf__blade"
                d="M0 0C-10-8-12-23 0-31C12-23 10-8 0 0Z"
                fill="#82a966"
                stroke="#dbe8a0"
                strokeWidth="1.4"
              />
              <path d="M0-2V-25" fill="none" stroke="#416b50" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          </g>
        );
      })}
    </g>
  );
}
