import type { CSSProperties, ReactNode } from "react";
import type { GrowthEvent, GrowthTrace, PathNumber } from "../../domain/types";
import { colourHex } from "../visualTypes";
import { clampUnit, seededUnit } from "./geometry";

export interface PathGrowthLayerProps {
  path: PathNumber;
  events?: readonly GrowthEvent[];
  traces?: readonly GrowthTrace[];
  maxVisibleEvents?: number;
}

interface VisualGrowthRecord {
  key: string;
  seed: string;
  colour: string;
  intensity: number;
  careAction: GrowthEvent["careAction"];
}

interface Point {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export function PathGrowthLayer({
  path,
  events = [],
  traces = [],
  maxVisibleEvents = 28,
}: PathGrowthLayerProps) {
  const records: VisualGrowthRecord[] = events.length > 0
    ? events.map((event) => ({
        key: `${event.date}-${event.pattern.seed}`,
        seed: event.pattern.seed,
        colour: colourHex(event.pattern.primaryColor),
        intensity: (event.checkIn.energy + event.checkIn.clarity) / 10,
        careAction: event.careAction,
      }))
    : traces.map((trace) => ({
        key: `${trace.date}-${trace.feature}-${trace.mergeTarget}`,
        seed: `${trace.date}:${trace.feature}:${trace.mergeTarget}`,
        colour: "#d9efa7",
        intensity: trace.intensity,
        careAction: trace.careAction,
      }));
  const visible = records.slice(-Math.max(0, Math.min(maxVisibleEvents, 36)));

  return (
    <g className={`path-growth path-growth--path-${path}`} data-event-count={visible.length}>
      {visible.map((record, index) => {
        const point = positionForPath(path, record.seed, index, visible.length);
        const style = {
          "--nf-growth-color": record.colour,
          "--nf-growth-delay": `${(index % 7) * 90}ms`,
        } as CSSProperties;
        return (
          <g
            className={`path-growth__event path-growth__event--${record.careAction}`}
            key={record.key}
            style={style}
            transform={`translate(${point.x} ${point.y}) rotate(${point.rotation}) scale(${point.scale})`}
          >
            {renderMotif(path, record.intensity)}
          </g>
        );
      })}
    </g>
  );
}

function positionForPath(path: PathNumber, seed: string, index: number, count: number): Point {
  const a = seededUnit(seed, "growth-x");
  const b = seededUnit(seed, "growth-y");
  const rotation = Math.round(seededUnit(seed, "growth-r") * 70 - 35);
  const scale = 0.72 + seededUnit(seed, "growth-s") * 0.48;
  const progress = count <= 1 ? 0.5 : index / (count - 1);

  switch (path) {
    case 1: return { x: 490 + a * 220, y: 590 - progress * 340 - b * 45, rotation: rotation * 0.28, scale };
    case 2: return { x: index % 2 === 0 ? 330 + a * 150 : 720 + a * 150, y: 520 - progress * 230 - b * 60, rotation: index % 2 === 0 ? -18 : 18, scale };
    case 3: return { x: 150 + a * 900, y: 600 - b * 120, rotation, scale: scale * 0.88 };
    case 4: return { x: 320 + (index % 5) * 140 + a * 40, y: 585 - Math.floor(index / 5) * 58, rotation: 0, scale: scale * 0.82 };
    case 5: return { x: 130 + progress * 920, y: 440 + Math.sin(progress * Math.PI * 3) * 85 + b * 45, rotation: rotation + 18, scale };
    case 6: return { x: 600 + Math.cos(progress * Math.PI * 2) * (170 + a * 90), y: 340 + Math.sin(progress * Math.PI * 2) * (90 + b * 70), rotation, scale };
    case 7: return { x: 350 + a * 500, y: 510 + b * 140, rotation: rotation * 0.3, scale };
    case 8: return { x: 285 + a * 630, y: 610 - progress * 350 - b * 42, rotation: rotation * 0.18, scale };
    case 9: {
      const angle = progress * Math.PI * 2 - Math.PI / 2;
      return { x: 600 + Math.cos(angle) * (245 + a * 45), y: 345 + Math.sin(angle) * (180 + b * 35), rotation: angle * 180 / Math.PI + 90, scale };
    }
  }
}

function renderMotif(path: PathNumber, rawIntensity: number): ReactNode {
  const intensity = clampUnit(rawIntensity);
  const size = 12 + intensity * 14;
  switch (path) {
    case 1:
      return <><path d={`M0 ${size}V${-size}`} /><path d={`m0 ${-size} ${-size * 0.62} ${size * 0.75}M0 ${-size * 0.55}l${size * 0.62} ${size * 0.72}`} /><path className="path-growth__fill" d={`m0 ${-size - 5} ${size * 0.45} ${size * 0.75}h${-size * 0.9}Z`} /></>;
    case 2:
      return <><circle className="path-growth__fill" cx={-size * 0.7} cy="0" r={size * 0.54} /><circle className="path-growth__fill" cx={size * 0.7} cy="0" r={size * 0.54} /><path d={`M${-size * 0.35} 0Q0 ${-size} ${size * 0.35} 0`} /></>;
    case 3:
      return <><g className="path-growth__fill"><ellipse cy={-size * 0.62} rx={size * 0.35} ry={size * 0.7} /><ellipse cx={size * 0.62} rx={size * 0.7} ry={size * 0.35} /><ellipse cy={size * 0.62} rx={size * 0.35} ry={size * 0.7} /><ellipse cx={-size * 0.62} rx={size * 0.7} ry={size * 0.35} /></g><circle cx="0" cy="0" r={size * 0.26} /></>;
    case 4:
      return <><path d={`M${-size} ${size * 0.7}H${size}M${-size * 0.75} 0h${size * 1.5}M${-size * 0.45} ${-size * 0.7}h${size * 0.9}`} /><rect className="path-growth__fill" x={-size * 0.28} y={-size * 1.05} width={size * 0.56} height={size * 0.38} /></>;
    case 5:
      return <><path d={`M${-size * 1.2} ${size * 0.5}C${-size * 0.5} ${-size} ${size * 0.4} ${size} ${size * 1.2} ${-size * 0.4}`} /><path d={`M${-size} ${size}C${-size * 0.1} 0 ${size * 0.45} ${size * 0.5} ${size} ${-size}`} /></>;
    case 6:
      return <><circle className="path-growth__fill" r={size} /><circle r={size * 0.66} /><path d={`M${-size * 0.55} ${size * 0.1}Q0 ${size * 0.9} ${size * 0.55} ${size * 0.1}`} /></>;
    case 7:
      return <><path className="path-growth__fill" d={`M0 ${-size} L${size * 0.28} ${-size * 0.3} L${size} 0 L${size * 0.28} ${size * 0.3} L0 ${size} L${-size * 0.28} ${size * 0.3} L${-size} 0 L${-size * 0.28} ${-size * 0.3}Z`} /><path className="path-growth__reflection" d={`M${-size} ${size * 1.3}Q0 ${size * 1.8} ${size} ${size * 1.3}`} /></>;
    case 8:
      return <><path className="path-growth__fill" d={`M0 ${-size * 1.25} L${size * 0.72} ${-size * 0.39} L0 ${size * 1.1} L${-size * 0.72} ${-size * 0.39}Z`} /><path d={`M0 ${-size * 1.25}V${size * 1.1}M${-size * 0.72} ${-size * 0.39}L0 0L${size * 0.72} ${-size * 0.39}`} /></>;
    case 9:
      return <><circle r={size} strokeDasharray={`${size * 1.1} ${size * 0.46}`} /><circle className="path-growth__fill" r={size * 0.36} /><path d={`M0 ${-size * 1.35}V${-size * 0.74}`} /></>;
  }
}
