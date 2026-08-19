import { useId, useMemo, type CSSProperties } from "react";

import {
  clamp,
  colourHex,
  colourName,
  type VisualPatternInput,
} from "./visualTypes";

export interface PatternArtProps {
  pattern: VisualPatternInput;
  id?: string;
  className?: string;
  animated?: boolean;
  decorative?: boolean;
  title?: string;
  description?: string;
}

interface PatternGlyphProps {
  pattern: VisualPatternInput;
  idPrefix: string;
  variant?: "daily" | "layer";
  layerOpacity?: number;
}

interface ShapeProps {
  form: string;
  cx: number;
  cy: number;
  radius: number;
  rotation: number;
  className?: string;
  opacity?: number;
}

function seedHash(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededUnit(seed: string, salt: number): number {
  let value = seedHash(`${seed}:${salt}`) + 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function polarPoint(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number,
): [number, number] {
  const angle = ((angleInDegrees - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function polygonPoints(
  sides: number,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
): string {
  return Array.from({ length: sides }, (_, index) =>
    polarPoint(cx, cy, radius, rotation + (index * 360) / sides)
      .map((value) => value.toFixed(2))
      .join(","),
  ).join(" ");
}

function starPoints(
  points: number,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  rotation: number,
): string {
  return Array.from({ length: points * 2 }, (_, index) => {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    return polarPoint(cx, cy, radius, rotation + (index * 180) / points)
      .map((value) => value.toFixed(2))
      .join(",");
  }).join(" ");
}

function spiralPath(cx: number, cy: number, radius: number, rotation: number): string {
  const points = Array.from({ length: 64 }, (_, index) => {
    const progress = index / 63;
    const angle = rotation + progress * 810;
    return polarPoint(cx, cy, 4 + progress * (radius - 4), angle);
  });

  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

function FormShape({
  form,
  cx,
  cy,
  radius,
  rotation,
  className,
  opacity,
}: ShapeProps) {
  const shared = {
    className,
    opacity,
  };

  switch (form.toLowerCase()) {
    case "triangle":
      return <polygon {...shared} points={polygonPoints(3, cx, cy, radius, rotation)} />;
    case "square":
      return <polygon {...shared} points={polygonPoints(4, cx, cy, radius, rotation + 45)} />;
    case "pentagon":
      return <polygon {...shared} points={polygonPoints(5, cx, cy, radius, rotation)} />;
    case "hexagon":
      return <polygon {...shared} points={polygonPoints(6, cx, cy, radius, rotation)} />;
    case "diamond":
      return (
        <polygon
          {...shared}
          points={`${cx},${cy - radius} ${cx + radius * 0.7},${cy} ${cx},${cy + radius} ${cx - radius * 0.7},${cy}`}
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
      );
    case "ring":
      return (
        <g {...shared} fill="none" transform={`rotate(${rotation} ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={radius} />
          <circle cx={cx} cy={cy} r={radius * 0.72} />
        </g>
      );
    case "star":
      return (
        <polygon
          {...shared}
          points={starPoints(9, cx, cy, radius, radius * 0.57, rotation)}
        />
      );
    case "spiral":
      return <path {...shared} d={spiralPath(cx, cy, radius, rotation)} />;
    case "circle":
    default:
      return <circle {...shared} cx={cx} cy={cy} r={radius} />;
  }
}

function symmetryCount(symmetry: VisualPatternInput["symmetry"], dailyNumber: number): number {
  if (typeof symmetry === "number") {
    return Math.round(clamp(symmetry, 2, 12));
  }

  switch (symmetry.toLowerCase()) {
    case "bilateral":
      return 4;
    case "rotational":
      return Math.round(clamp(dailyNumber + 2, 5, 11));
    case "asymmetric":
      return Math.round(clamp(dailyNumber + 1, 4, 9));
    case "radial":
    default:
      return 9;
  }
}

function opacityValue(value: number | undefined, fallback: number): number {
  if (value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  return clamp(value > 1 ? value / 10 : value, 0.08, 0.92);
}

function directionOffset(direction: string, progress: number): [number, number, number] {
  switch (direction.toLowerCase()) {
    case "inward":
      return [0, 0, -progress * 10];
    case "outward":
      return [0, 0, progress * 9];
    case "ascending":
      return [0, -progress * 9, progress * 2];
    case "descending":
      return [0, progress * 9, progress * 2];
    case "rotating":
      return [progress * 4, -progress * 3, progress * 16];
    case "balanced":
    default:
      return [0, 0, 0];
  }
}

function directionPath(direction: string): string {
  switch (direction.toLowerCase()) {
    case "inward":
      return "M 48 160 C 91 91 229 91 272 160 C 229 229 91 229 48 160 M 98 160 L 142 160";
    case "outward":
      return "M 138 160 L 52 160 M 182 160 L 268 160 M 160 138 L 160 52 M 160 182 L 160 268";
    case "ascending":
      return "M 82 228 C 105 194 137 184 160 151 C 185 115 207 98 238 78";
    case "descending":
      return "M 82 92 C 109 122 136 134 160 169 C 184 204 209 214 238 242";
    case "rotating":
      return "M 73 187 C 45 112 129 46 201 79 C 260 106 263 189 211 226 C 174 253 121 240 96 211";
    case "balanced":
    default:
      return "M 58 160 C 96 129 124 129 160 160 C 196 191 224 191 262 160";
  }
}

/**
 * Shared SVG geometry used by both a daily pattern and the layered week. It is
 * exported so composition remains true SVG rather than embedding data URLs.
 */
export function PatternGlyph({
  pattern,
  idPrefix,
  variant = "daily",
  layerOpacity = 1,
}: PatternGlyphProps) {
  const primary = colourHex(pattern.primaryColor);
  const secondary = colourHex(pattern.secondaryColor);
  const layers = Math.round(clamp(pattern.layerCount, 2, 9));
  const spokes = symmetryCount(pattern.symmetry, pattern.dailyNumber);
  const density = Math.round(
    clamp(pattern.density <= 1 ? 4 + pattern.density * 10 : pattern.density + 3, 5, 16),
  );
  const lineWeight = clamp(pattern.lineWeight, 0.55, 3.4);
  const baseOpacity = opacityValue(pattern.opacityProfile?.base ?? pattern.opacity, 0.22);
  const accentOpacity = opacityValue(pattern.opacityProfile?.accent ?? pattern.opacity, 0.6);
  const lineOpacity = opacityValue(pattern.opacityProfile?.line ?? pattern.opacity, 0.46);
  const isAsymmetric =
    typeof pattern.symmetry === "string" && pattern.symmetry.toLowerCase() === "asymmetric";
  const gradientId = `${idPrefix}-gradient`;
  const washId = `${idPrefix}-wash`;
  const clipId = `${idPrefix}-clip`;
  const glowId = `${idPrefix}-glow`;
  const layerMultiplier = variant === "layer" ? 0.7 : 1;

  const guideRings = Array.from({ length: layers }, (_, index) => {
    const progress = layers === 1 ? 0 : index / (layers - 1);
    return 42 + progress * 88;
  });
  const rays = Array.from({ length: spokes }, (_, index) => {
    const jitter = isAsymmetric ? (seededUnit(pattern.seed, index + 40) - 0.5) * 18 : 0;
    const angle = pattern.rotation + (index * 360) / spokes + jitter;
    return {
      inner: polarPoint(160, 160, 27 + seededUnit(pattern.seed, index) * 12, angle),
      outer: polarPoint(160, 160, 116 + seededUnit(pattern.seed, index + 90) * 16, angle),
      opacity: 0.32 + seededUnit(pattern.seed, index + 180) * 0.5,
    };
  });
  const nodes = Array.from({ length: density }, (_, index) => {
    const ring = index % Math.max(2, layers - 1);
    const radius = 58 + ring * (62 / Math.max(1, layers - 2));
    const irregularity = isAsymmetric ? seededUnit(pattern.seed, index + 320) * 19 : 0;
    const angle =
      pattern.rotation +
      (index * 360) / density +
      irregularity +
      (pattern.dailyNumber * 360) / 81;
    const [x, y] = polarPoint(160, 160, radius, angle);
    return {
      x,
      y,
      radius: 1.4 + seededUnit(pattern.seed, index + 620) * 2.6,
    };
  });

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="8%" y1="10%" x2="92%" y2="90%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="52%" stopColor={secondary} />
          <stop offset="100%" stopColor={primary} />
        </linearGradient>
        <radialGradient id={washId} cx="50%" cy="47%" r="56%">
          <stop offset="0%" stopColor={secondary} stopOpacity={baseOpacity * 0.7} />
          <stop offset="58%" stopColor={primary} stopOpacity={baseOpacity * 0.25} />
          <stop offset="100%" stopColor={primary} stopOpacity="0" />
        </radialGradient>
        <clipPath id={clipId}>
          <circle cx="160" cy="160" r="146" />
        </clipPath>
        <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <g
        className={`pattern-glyph pattern-glyph--${variant}`}
        clipPath={`url(#${clipId})`}
        opacity={layerOpacity}
      >
        {variant === "daily" && (
          <>
            <circle
              className="pattern-glyph__wash pattern-art__breath"
              cx="160"
              cy="160"
              r="143"
              fill={`url(#${washId})`}
            />
            <circle
              cx="160"
              cy="160"
              r="58"
              fill={secondary}
              filter={`url(#${glowId})`}
              opacity={baseOpacity * 0.22}
            />
          </>
        )}

        <g
          className="pattern-glyph__guides pattern-art__orbit pattern-art__orbit--reverse"
          fill="none"
          stroke={primary}
          strokeWidth={Math.max(0.45, lineWeight * 0.45)}
        >
          {guideRings.map((radius, index) => (
            <circle
              key={radius}
              cx="160"
              cy="160"
              r={radius}
              opacity={(baseOpacity * (0.9 - index * 0.055) * layerMultiplier).toFixed(3)}
              strokeDasharray={
                index % 2 === 0
                  ? `${2 + pattern.dailyNumber} ${6 + pattern.pathNumber}`
                  : undefined
              }
            />
          ))}
        </g>

        <g
          className="pattern-glyph__rays pattern-art__reveal"
          stroke={`url(#${gradientId})`}
          strokeLinecap="round"
          strokeWidth={lineWeight * 0.58}
        >
          {rays.map((ray, index) => (
            <line
              key={`${ray.outer[0]}-${ray.outer[1]}`}
              x1={ray.inner[0]}
              y1={ray.inner[1]}
              x2={ray.outer[0]}
              y2={ray.outer[1]}
              opacity={lineOpacity * ray.opacity * layerMultiplier}
              strokeDasharray={index % 3 === 0 ? "2 7" : undefined}
            />
          ))}
        </g>

        <g
          className="pattern-glyph__forms pattern-art__breath"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={lineWeight}
        >
          {Array.from({ length: layers }, (_, index) => {
            const progress = layers === 1 ? 0 : index / (layers - 1);
            const [offsetX, offsetY, radiusShift] = directionOffset(pattern.direction, progress);
            const radius = 34 + progress * 91 + radiusShift;
            const rotation =
              pattern.rotation +
              index * (360 / Math.max(3, spokes)) * (pattern.direction === "rotating" ? 1 : 0.36);

            return (
              <FormShape
                key={`${pattern.form}-${index}`}
                form={pattern.form}
                cx={160 + offsetX}
                cy={160 + offsetY}
                radius={radius}
                rotation={rotation}
                className="pattern-glyph__form"
                opacity={Number(
                  (accentOpacity * (0.82 - progress * 0.38) * layerMultiplier).toFixed(3),
                )}
              />
            );
          })}
        </g>

        <path
          className="pattern-glyph__direction pattern-art__trace"
          d={directionPath(pattern.direction)}
          fill="none"
          stroke={secondary}
          strokeLinecap="round"
          strokeWidth={lineWeight * 0.8}
          opacity={accentOpacity * 0.58 * layerMultiplier}
          transform={`rotate(${pattern.rotation * 0.18} 160 160)`}
        />

        <g className="pattern-glyph__nodes" fill={secondary}>
          {nodes.map((node, index) => (
            <circle
              key={`${node.x}-${node.y}`}
              className={index % 3 === 0 ? "pattern-art__pulse" : undefined}
              cx={node.x}
              cy={node.y}
              r={node.radius}
              opacity={accentOpacity * (0.5 + (index % 4) * 0.1) * layerMultiplier}
            />
          ))}
        </g>

        <g
          className="pattern-glyph__core pattern-art__orbit"
          fill={secondary}
          fillOpacity={baseOpacity * 0.24 * layerMultiplier}
          stroke={`url(#${gradientId})`}
          strokeWidth={lineWeight}
        >
          <FormShape
            form={pattern.form}
            cx={160}
            cy={160}
            radius={23 + pattern.dailyNumber * 1.15}
            rotation={pattern.rotation + pattern.pathNumber * 4}
          />
          <circle cx="160" cy="160" r={3.2 + pattern.pathNumber * 0.28} fill={secondary} />
        </g>
      </g>
    </>
  );
}

function safeId(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned || "ninefold-pattern";
}

export function PatternArt({
  pattern,
  id,
  className,
  animated = true,
  decorative = false,
  title,
  description,
}: PatternArtProps) {
  const generatedId = useId();
  const idPrefix = safeId(id ?? `ninefold-${generatedId}`);
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;
  const accessibleTitle =
    title ?? `Ninefold pattern: Path ${pattern.pathNumber}, daily number ${pattern.dailyNumber}`;
  const accessibleDescription =
    description ??
    `${colourName(pattern.primaryColor)} and ${colourName(pattern.secondaryColor)} form a ${pattern.form} composition with ${pattern.direction} direction and ${String(pattern.symmetry)} symmetry.`;
  const duration = useMemo(
    () => `${34 + Math.round(seededUnit(pattern.seed, 904) * 18)}s`,
    [pattern.seed],
  );

  return (
    <svg
      id={id}
      className={[
        "pattern-art",
        animated ? "pattern-art--animated" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      viewBox="0 0 320 320"
      preserveAspectRatio="xMidYMid meet"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-labelledby={decorative ? undefined : `${titleId} ${descriptionId}`}
      focusable="false"
      style={{ "--pattern-duration": duration } as CSSProperties}
      xmlns="http://www.w3.org/2000/svg"
    >
      {!decorative && (
        <>
          <title id={titleId}>{accessibleTitle}</title>
          <desc id={descriptionId}>{accessibleDescription}</desc>
        </>
      )}
      <PatternGlyph pattern={pattern} idPrefix={idPrefix} />
    </svg>
  );
}
