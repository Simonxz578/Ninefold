import { useId, type CSSProperties } from "react";

import { PatternGlyph } from "./PatternArt";
import {
  colourHex,
  type VisualPatternInput,
  type WeeklyVisualEntry,
} from "./visualTypes";

export interface WeeklyCompositionProps {
  entries: readonly WeeklyVisualEntry[];
  visibleIds?: readonly string[] | ReadonlySet<string>;
  id?: string;
  className?: string;
  title?: string;
  description?: string;
  animated?: boolean;
  decorative?: boolean;
}

function safeId(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned || "ninefold-week";
}

function includesId(
  visibleIds: WeeklyCompositionProps["visibleIds"],
  entry: WeeklyVisualEntry,
): boolean {
  if (visibleIds === undefined) {
    return entry.visible !== false;
  }

  if (Array.isArray(visibleIds)) {
    return visibleIds.includes(entry.id);
  }

  return (visibleIds as ReadonlySet<string>).has(entry.id);
}

function layerTransform(index: number, total: number, pattern: VisualPatternInput): string {
  const offset = index - (total - 1) / 2;
  const direction = pattern.direction.toLowerCase();
  const horizontal = direction === "ascending" || direction === "descending" ? offset * 2.4 : 0;
  const vertical = direction === "ascending" ? offset * -2.4 : direction === "descending" ? offset * 2.4 : 0;
  const rotation = offset * 3.6 + pattern.rotation * 0.08;
  return `translate(${horizontal.toFixed(2)} ${vertical.toFixed(2)}) rotate(${rotation.toFixed(2)} 160 160)`;
}

export function WeeklyComposition({
  entries,
  visibleIds,
  id,
  className,
  title = "Seven-day layered composition",
  description,
  animated = true,
  decorative = false,
}: WeeklyCompositionProps) {
  const generatedId = useId();
  const idPrefix = safeId(id ?? `ninefold-week-${generatedId}`);
  const titleId = `${idPrefix}-title`;
  const descriptionId = `${idPrefix}-description`;
  const weekEntries = entries.slice(-7);
  const visibleEntries = weekEntries.filter((entry) => includesId(visibleIds, entry));
  const primary = colourHex(visibleEntries[0]?.pattern.primaryColor ?? "Indigo");
  const secondary = colourHex(
    visibleEntries[visibleEntries.length - 1]?.pattern.secondaryColor ?? "Amber",
  );
  const visibleLabels = visibleEntries.map((entry) => entry.date ?? entry.id);
  const accessibleDescription =
    description ??
    (visibleLabels.length > 0
      ? `${visibleLabels.length} visible daily layers: ${visibleLabels.join(", ")}. Each transparent layer is derived from that day's saved pattern.`
      : "No daily layers are currently visible.");

  return (
    <svg
      id={id}
      className={[
        "weekly-composition",
        animated ? "weekly-composition--animated" : "",
        visibleEntries.length === 0 ? "weekly-composition--empty" : "",
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
      xmlns="http://www.w3.org/2000/svg"
    >
      {!decorative && (
        <>
          <title id={titleId}>{title}</title>
          <desc id={descriptionId}>{accessibleDescription}</desc>
        </>
      )}

      <defs>
        <radialGradient id={`${idPrefix}-week-wash`} cx="50%" cy="48%" r="55%">
          <stop offset="0%" stopColor={secondary} stopOpacity="0.12" />
          <stop offset="62%" stopColor={primary} stopOpacity="0.045" />
          <stop offset="100%" stopColor={primary} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-week-edge`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primary} stopOpacity="0.2" />
          <stop offset="50%" stopColor="#f0e7d7" stopOpacity="0.12" />
          <stop offset="100%" stopColor={secondary} stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <circle
        className="weekly-composition__wash"
        cx="160"
        cy="160"
        r="148"
        fill={`url(#${idPrefix}-week-wash)`}
      />
      <circle
        className="weekly-composition__edge"
        cx="160"
        cy="160"
        r="145"
        fill="none"
        stroke={`url(#${idPrefix}-week-edge)`}
        strokeWidth="0.8"
      />

      <g className="weekly-composition__layers">
        {weekEntries.map((entry, index) => {
          const visible = includesId(visibleIds, entry);
          const opacity = 0.36 + (index / Math.max(1, weekEntries.length - 1)) * 0.28;

          return (
            <g
              key={entry.id}
              className="weekly-composition__layer"
              data-layer-id={entry.id}
              data-layer-date={entry.date}
              display={visible ? undefined : "none"}
              aria-hidden="true"
              transform={layerTransform(index, weekEntries.length, entry.pattern)}
              style={{ "--layer-index": index } as CSSProperties}
            >
              <PatternGlyph
                pattern={entry.pattern}
                idPrefix={`${idPrefix}-layer-${index}`}
                variant="layer"
                layerOpacity={opacity}
              />
            </g>
          );
        })}
      </g>

      <g className="weekly-composition__anchor" aria-hidden="true">
        <circle cx="160" cy="160" r="4.5" fill="#f0e7d7" fillOpacity="0.74" />
        <circle
          cx="160"
          cy="160"
          r="10"
          fill="none"
          stroke="#f0e7d7"
          strokeOpacity="0.26"
          strokeWidth="0.7"
        />
      </g>
    </svg>
  );
}

