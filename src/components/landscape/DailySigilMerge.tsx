import type { CSSProperties, ReactNode } from "react";
import { getPathGrammar } from "../../domain/pathGrammars";
import type { GeometricForm, PathNumber, PatternConfiguration, SigilMergeTarget } from "../../domain/types";
import { colourHex } from "../visualTypes";
import { seededUnit } from "./geometry";

export interface DailySigilMergeProps {
  path: PathNumber;
  pattern?: PatternConfiguration;
  target?: SigilMergeTarget;
}

const TARGET_POSITIONS: Readonly<Record<SigilMergeTarget, readonly [number, number]>> = {
  flower: [510, 282],
  fruit: [692, 360],
  "branch-node": [604, 372],
  "root-mark": [570, 594],
  "water-mark": [735, 558],
  "bridge-motif": [600, 448],
  "crystal-face": [620, 256],
  constellation: [760, 156],
  "nebula-node": [612, 124],
  "seasonal-ring": [600, 300],
};

export function DailySigilMerge({ path, pattern, target }: DailySigilMergeProps) {
  if (!pattern) return null;
  const grammar = getPathGrammar(path);
  const selectedTarget = target ?? grammar.sigilMergeTargets[
    Math.floor(seededUnit(pattern.seed, "sigil-target") * grammar.sigilMergeTargets.length)
  ] ?? grammar.sigilMergeTargets[0];
  const [x, y] = TARGET_POSITIONS[selectedTarget];
  const radius = 12 + pattern.dailyNumber * 1.35;
  const style = {
    "--nf-sigil-primary": colourHex(pattern.primaryColor),
    "--nf-sigil-secondary": colourHex(pattern.secondaryColor),
  } as CSSProperties;

  return (
    <g
      className={`daily-sigil-merge daily-sigil-merge--${selectedTarget}`}
      data-daily-number={pattern.dailyNumber}
      data-merge-target={selectedTarget}
      style={style}
      transform={`translate(${x} ${y}) rotate(${pattern.rotation})`}
    >
      <circle className="daily-sigil-merge__halo" r={radius * 1.8} />
      {renderForm(pattern.form, radius)}
      <circle className="daily-sigil-merge__number-ring" r={radius * 0.45} />
      <text className="daily-sigil-merge__number" x="0" y="1">{pattern.dailyNumber}</text>
    </g>
  );
}

function renderForm(form: GeometricForm, radius: number): ReactNode {
  switch (form) {
    case "circle": return <circle className="daily-sigil-merge__form" r={radius} />;
    case "triangle": return <path className="daily-sigil-merge__form" d={`M0 ${-radius} ${radius * 0.88} ${radius * 0.62} ${-radius * 0.88} ${radius * 0.62}Z`} />;
    case "square": return <rect className="daily-sigil-merge__form" x={-radius * 0.72} y={-radius * 0.72} width={radius * 1.44} height={radius * 1.44} />;
    case "pentagon": return <path className="daily-sigil-merge__form" d={polygon(5, radius)} />;
    case "hexagon": return <path className="daily-sigil-merge__form" d={polygon(6, radius)} />;
    case "diamond": return <path className="daily-sigil-merge__form" d={`M0 ${-radius} ${radius * 0.75} 0 0 ${radius} ${-radius * 0.75} 0Z`} />;
    case "ring": return <><circle className="daily-sigil-merge__form" r={radius} /><circle className="daily-sigil-merge__cutout" r={radius * 0.62} /></>;
    case "star": return <path className="daily-sigil-merge__form" d={star(radius)} />;
    case "spiral": return <path className="daily-sigil-merge__spiral" d={`M0 0c${radius * 0.2} ${-radius * 0.36} ${radius * 0.8} ${-radius * 0.18} ${radius * 0.72} ${radius * 0.3}-.12 ${radius * 0.76}-${radius * 1.14} ${radius * 0.98}-${radius * 1.55} ${radius * 0.28}-.55 ${-radius * 0.92}.${radius * 0.38}-${radius * 2.05} ${radius * 1.4}-${radius * 2.22}`} />;
  }
}

function polygon(sides: number, radius: number): string {
  return Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / sides;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ") + "Z";
}

function star(radius: number): string {
  return Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    const pointRadius = index % 2 === 0 ? radius : radius * 0.42;
    return `${index === 0 ? "M" : "L"}${(Math.cos(angle) * pointRadius).toFixed(2)} ${(Math.sin(angle) * pointRadius).toFixed(2)}`;
  }).join(" ") + "Z";
}
