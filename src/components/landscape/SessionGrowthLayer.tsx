import type { CSSProperties } from "react";
import type { GrowthStage } from "../../domain/restSession";
import type { PathNumber } from "../../domain/types";

interface GrowthLeaf {
  cx: number;
  cy: number;
  rotate: number;
  scale?: number;
  side?: "left" | "right";
}

interface GrowthBranch {
  d: string;
  delay?: number;
  kind?: "limb" | "twig";
  side?: "left" | "right";
}

interface StageGeometry {
  branches?: readonly GrowthBranch[];
  leaves?: readonly GrowthLeaf[];
}

const STAGE_GEOMETRY: Readonly<Record<Exclude<GrowthStage, 0>, StageGeometry>> = {
  1: {
    branches: [
      { d: "M596 438C565 423 526 387 486 342" },
      { d: "M552 411C532 394 511 382 487 374", delay: 0.34, kind: "twig" },
      { d: "M521 380C498 368 476 354 453 338", delay: 0.54, kind: "twig" },
      { d: "M499 356C476 348 458 331 443 312", delay: 0.72, kind: "twig" },
    ],
    leaves: [
      { cx: 486, cy: 342, rotate: -38, scale: 0.78 },
      { cx: 487, cy: 374, rotate: 42, scale: 0.56 },
      { cx: 453, cy: 338, rotate: -61, scale: 0.58 },
      { cx: 443, cy: 312, rotate: -39, scale: 0.68 },
      { cx: 508, cy: 368, rotate: 24, scale: 0.52 },
      { cx: 529, cy: 395, rotate: -18, scale: 0.48 },
    ],
  },
  2: {
    branches: [
      { d: "M603 401C647 383 692 336 725 289" },
      { d: "M650 375C674 354 696 338 718 321", delay: 0.34, kind: "twig" },
      { d: "M681 347C705 335 729 316 748 292", delay: 0.54, kind: "twig" },
      { d: "M704 316C731 303 753 283 770 258", delay: 0.72, kind: "twig" },
    ],
    leaves: [
      { cx: 725, cy: 289, rotate: 34, scale: 0.78 },
      { cx: 718, cy: 321, rotate: -40, scale: 0.56 },
      { cx: 748, cy: 292, rotate: 58, scale: 0.58 },
      { cx: 770, cy: 258, rotate: 40, scale: 0.68 },
      { cx: 696, cy: 339, rotate: -26, scale: 0.52 },
      { cx: 671, cy: 357, rotate: 20, scale: 0.48 },
    ],
  },
  3: {
    branches: [
      { d: "M600 334C594 290 608 230 626 184" },
      { d: "M604 277C583 255 562 239 539 222", delay: 0.28, kind: "twig" },
      { d: "M612 247C638 231 662 211 681 188", delay: 0.48, kind: "twig" },
      { d: "M602 309C576 294 554 278 532 258", delay: 0.64, kind: "twig" },
      { d: "M616 221C618 198 612 176 603 154", delay: 0.78, kind: "twig" },
    ],
    leaves: [
      { cx: 626, cy: 184, rotate: 10, scale: 0.82 },
      { cx: 539, cy: 222, rotate: -54, scale: 0.62 },
      { cx: 681, cy: 188, rotate: 52, scale: 0.62 },
      { cx: 532, cy: 258, rotate: -64, scale: 0.56 },
      { cx: 603, cy: 154, rotate: -6, scale: 0.7 },
      { cx: 574, cy: 245, rotate: -31, scale: 0.52 },
      { cx: 651, cy: 224, rotate: 34, scale: 0.52 },
    ],
  },
  4: {
    branches: [
      { d: "M487 343C455 324 421 294 390 265", side: "left" },
      { d: "M725 289C760 277 790 250 818 220", delay: 0.16, side: "right" },
      { d: "M539 222C514 202 487 182 456 160", delay: 0.48, kind: "twig" },
      { d: "M681 188C714 172 742 150 768 124", delay: 0.64, kind: "twig" },
      { d: "M420 292C395 287 374 273 355 254", delay: 0.74, kind: "twig", side: "left" },
      { d: "M787 244C813 239 835 224 852 203", delay: 0.82, kind: "twig", side: "right" },
    ],
    leaves: [
      { cx: 390, cy: 265, rotate: -58, scale: 0.7, side: "left" },
      { cx: 818, cy: 220, rotate: 57, scale: 0.7, side: "right" },
      { cx: 456, cy: 160, rotate: -43, scale: 0.62 },
      { cx: 768, cy: 124, rotate: 43, scale: 0.62 },
      { cx: 355, cy: 254, rotate: -68, scale: 0.56, side: "left" },
      { cx: 852, cy: 203, rotate: 67, scale: 0.56, side: "right" },
      { cx: 421, cy: 293, rotate: 34, scale: 0.48, side: "left" },
      { cx: 787, cy: 244, rotate: -34, scale: 0.48, side: "right" },
    ],
  },
  5: {
    branches: [
      { d: "M603 154C581 132 558 112 530 94" },
      { d: "M603 154C629 136 655 110 680 85", delay: 0.14 },
      { d: "M390 265C364 255 340 237 322 212", delay: 0.42, kind: "twig", side: "left" },
      { d: "M818 220C849 205 872 180 892 151", delay: 0.56, kind: "twig", side: "right" },
      { d: "M530 94C510 86 492 72 478 54", delay: 0.72, kind: "twig" },
      { d: "M680 85C704 78 725 64 742 45", delay: 0.82, kind: "twig" },
    ],
    leaves: [
      { cx: 530, cy: 94, rotate: -28, scale: 0.66 },
      { cx: 680, cy: 85, rotate: 30, scale: 0.66 },
      { cx: 322, cy: 212, rotate: -65, scale: 0.58, side: "left" },
      { cx: 892, cy: 151, rotate: 65, scale: 0.58, side: "right" },
      { cx: 478, cy: 54, rotate: -42, scale: 0.54 },
      { cx: 742, cy: 45, rotate: 42, scale: 0.54 },
      { cx: 550, cy: 113, rotate: 36, scale: 0.45 },
      { cx: 658, cy: 110, rotate: -36, scale: 0.45 },
    ],
  },
};

const GROWTH_STAGES = [1, 2, 3, 4, 5] as const;

export interface SessionGrowthLayerProps {
  path: PathNumber;
  stage?: GrowthStage;
  trunkPath: string;
}

export function SessionGrowthLayer({
  path,
  stage = 0,
  trunkPath,
}: SessionGrowthLayerProps) {
  const pathTilt = (path - 5) * 0.7;
  const unlockedStages = GROWTH_STAGES.filter((value) => value <= stage);

  return (
    <g
      className={`session-growth session-growth--stage-${stage}`}
      data-growth-stage={stage}
    >
      <g className="session-growth__timeline" aria-hidden="true">
        <circle className="session-growth__root-glow" cx="600" cy="580" r="76" />
        <g className="session-growth__root-network">
          <path style={{ "--nf-root-delay": "0s" } as CSSProperties} d="M600 580C558 588 520 612 480 646" pathLength="1" />
          <path style={{ "--nf-root-delay": ".14s" } as CSSProperties} d="M600 582C647 590 688 614 731 650" pathLength="1" />
          <path style={{ "--nf-root-delay": ".28s" } as CSSProperties} d="M598 582C585 611 579 640 580 674" pathLength="1" />
          <path style={{ "--nf-root-delay": ".36s" } as CSSProperties} d="M603 584C619 610 629 637 632 667" pathLength="1" />
        </g>
        <path className="session-growth__trunk-light" d={trunkPath} pathLength="1" />
      </g>

      <g className="session-journey" aria-hidden="true" transform={`rotate(${pathTilt} 600 430)`}>
        {GROWTH_STAGES.map((stageNumber) => (
          <GrowthStageAnatomy journey key={stageNumber} path={path} stageNumber={stageNumber} />
        ))}
      </g>

      <g className="session-growth__botanical" transform={`rotate(${pathTilt} 600 430)`}>
        {unlockedStages.map((stageNumber) => (
          <GrowthStageAnatomy key={stageNumber} path={path} stageNumber={stageNumber} />
        ))}

        {stage === 5 && (
          <g className="session-growth__renewal" aria-hidden="true">
            <circle cx="520" cy="234" r="7" />
            <circle cx="703" cy="250" r="6" />
            <circle cx="460" cy="338" r="5" />
            <path d="M478 522c76-15 151-14 230 1" />
          </g>
        )}
      </g>
    </g>
  );
}

interface GrowthStageAnatomyProps {
  journey?: boolean;
  path: PathNumber;
  stageNumber: Exclude<GrowthStage, 0>;
}

function GrowthStageAnatomy({
  journey = false,
  path,
  stageNumber,
}: GrowthStageAnatomyProps) {
  const geometry = STAGE_GEOMETRY[stageNumber];
  const journeyClassName = journey
    ? ` session-journey__stage session-journey__stage--${stageNumber}`
    : "";

  return (
    <g
      className={`session-growth__stage session-growth__stage--${stageNumber}${journeyClassName}`}
      data-session-growth-stage={journey ? undefined : stageNumber}
    >
      <g className="session-growth__branch-network">
        {geometry.branches?.map((branch) => {
          const offset = pathTwoOffset(path, stageNumber, branch.side);
          return (
            <g
              className={`session-growth__branch-system session-growth__branch-system--${branch.kind ?? "limb"}`}
              key={branch.d}
              style={{ "--nf-branch-delay": `${branch.delay ?? 0}s` } as CSSProperties}
              transform={offset === 0 ? undefined : `translate(${offset} 0)`}
            >
              <path className="session-growth__branch-shadow" d={branch.d} pathLength="1" />
              <path className="session-growth__branch" d={branch.d} pathLength="1" />
              <path className="session-growth__branch-sap" d={branch.d} pathLength="1" />
            </g>
          );
        })}
      </g>
      <g className="session-growth__leaves">
        {geometry.leaves?.map((leaf, index) => (
          <g
            className="session-growth__leaf"
            key={`${leaf.cx}-${leaf.cy}`}
            style={{ "--nf-leaf-delay": `${Math.min(index * 0.34, 2.72)}s` } as CSSProperties}
            transform={`translate(${leaf.cx + pathTwoOffset(path, stageNumber, leaf.side)} ${leaf.cy}) rotate(${leaf.rotate}) scale(${leaf.scale ?? 1})`}
          >
            <circle className="session-growth__bud" r="8" />
            <path className="session-growth__leaf-blade" d="M0 0C-28-27-31-59 0-79 31-58 29-26 0 0Z" />
            <path className="session-growth__leaf-vein" d="M0-4C-1-24 0-43 0-62" />
            <path className="session-growth__leaf-vein session-growth__leaf-vein--side" d="M0-22l-12-10M0-34l14-11M0-47l-10-9" />
          </g>
        ))}
      </g>
      <g className="session-growth__motes" aria-hidden="true">
        {geometry.leaves?.slice(0, 5).map((leaf, index) => (
          <circle
            cx={leaf.cx + pathTwoOffset(path, stageNumber, leaf.side) + (index % 2 === 0 ? -10 : 12)}
            cy={Math.max(leaf.cy - 18 - index * 3, 42)}
            key={`${leaf.cx}-${leaf.cy}-mote`}
            r={3.5 - index * 0.32}
            style={{ "--nf-mote-delay": `${index * 0.36}s` } as CSSProperties}
          />
        ))}
      </g>
      {stageNumber === 3 && <StageThreeEcology />}
      {stageNumber === 4 && <StageFourEcology />}
      {stageNumber === 5 && <StageFiveEcology />}
    </g>
  );
}

function pathTwoOffset(
  path: PathNumber,
  stage: Exclude<GrowthStage, 0>,
  side?: "left" | "right",
): number {
  // Path 2 grows from paired trunks. The first two additions attach to the
  // corresponding stems; later extensions retain that offset so every limb
  // remains physically joined to the branch it continues.
  if (path !== 2) return 0;
  if (side === "left" || stage === 1) return -28;
  if (side === "right" || stage === 2) return 28;
  return 0;
}

function StageThreeEcology() {
  return (
    <g className="session-growth__ecology session-growth__ecology--grass">
      <path d="m500 594 8-33 8 32m36 9 7-39 9 38m82-7 7-34 9 33m34 12 8-38 8 36" />
    </g>
  );
}

function StageFourEcology() {
  return (
    <g className="session-growth__ecology session-growth__ecology--life">
      <g className="session-growth__flowers">
        <g transform="translate(480 596)"><circle r="10" /><circle cy="-13" r="7" /><circle cx="12" r="7" /><circle cy="13" r="7" /><circle cx="-12" r="7" /></g>
        <g transform="translate(728 603) scale(.8)"><circle r="10" /><circle cy="-13" r="7" /><circle cx="12" r="7" /><circle cy="13" r="7" /><circle cx="-12" r="7" /></g>
      </g>
      <g className="session-growth__fireflies">
        <circle cx="434" cy="386" r="4" />
        <circle cx="782" cy="418" r="3.5" />
        <circle cx="760" cy="270" r="3" />
      </g>
    </g>
  );
}

function StageFiveEcology() {
  return (
    <g className="session-growth__ecology session-growth__ecology--complete">
      <path className="session-growth__root-ring" d="M430 620c102-30 238-30 344 0" />
      <path className="session-growth__ripple" d="M438 650c98-19 226-19 324 0" />
      <path className="session-growth__ripple" d="M480 674c73-12 166-12 238 0" />
      <circle className="session-growth__crown-light" cx="600" cy="255" r="176" />
    </g>
  );
}
