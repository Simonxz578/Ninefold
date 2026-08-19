import { useId, type FocusEvent, type PointerEvent } from "react";
import { PATH_NUMBERS, type PathNumber } from "../../domain";
import { WORLD_TERRAINS } from "../worldData";
import { WorldScene } from "./WorldScene";

export interface WorldPrototypeOption {
  path: PathNumber;
  label: string;
  description?: string;
}

export interface WorldPrototypePickerProps {
  legend: string;
  value: PathNumber | null;
  onChange: (path: PathNumber) => void;
  onPreview?: (path: PathNumber | null) => void;
  options?: readonly WorldPrototypeOption[];
  name?: string;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_OPTIONS: readonly WorldPrototypeOption[] = PATH_NUMBERS.map((path) => ({
  path,
  label: WORLD_TERRAINS[path].name.en,
}));

export function WorldPrototypePicker({
  legend,
  value,
  onChange,
  onPreview,
  options = DEFAULT_OPTIONS,
  name,
  disabled = false,
  className = "",
}: WorldPrototypePickerProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const groupName = name ?? `v3-world-prototype-${reactId}`;

  const clearFocusPreview = (event: FocusEvent<HTMLLabelElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    onPreview?.(null);
  };

  const clearPointerPreview = (event: PointerEvent<HTMLLabelElement>) => {
    if (event.currentTarget.contains(document.activeElement)) return;
    onPreview?.(null);
  };

  return (
    <fieldset className={`v3-world-prototype-picker ${className}`.trim()} disabled={disabled}>
      <legend className="v3-world-prototype-picker__legend">{legend}</legend>
      <div className="v3-world-prototype-picker__grid">
        {options.map((option) => {
          const selected = option.path === value;
          const descriptionId = option.description
            ? `v3-world-prototype-${reactId}-${option.path}-description`
            : undefined;
          return (
            <label
              className={`v3-world-prototype${selected ? " v3-world-prototype--selected" : ""}`}
              data-path={option.path}
              data-selected={selected || undefined}
              key={option.path}
              onPointerEnter={() => onPreview?.(option.path)}
              onPointerLeave={clearPointerPreview}
              onPointerCancel={clearPointerPreview}
              onFocus={() => onPreview?.(option.path)}
              onBlur={clearFocusPreview}
            >
              <input
                className="v3-world-prototype__input"
                type="radio"
                name={groupName}
                value={option.path}
                checked={selected}
                aria-describedby={descriptionId}
                onChange={() => onChange(option.path)}
              />
              <span className="v3-world-prototype__visual" aria-hidden="true">
                <WorldScene
                  stage="prototype"
                  path={option.path}
                  mood={5}
                  energy={5}
                  decorative
                  compact
                />
              </span>
              <span className="v3-world-prototype__label">{option.label}</span>
              {option.description && (
                <span className="v3-world-prototype__description" id={descriptionId}>
                  {option.description}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
