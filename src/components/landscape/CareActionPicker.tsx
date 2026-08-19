import { useId } from "react";
import { CARE_ACTIONS, type CareAction, type LandscapeLocale } from "../../domain/types";
import { dictionaries } from "../../i18n";
import "../../living-world.css";
import { sanitiseSvgId } from "./geometry";

export interface CareActionPickerProps {
  value: CareAction | null;
  onChange: (careAction: CareAction) => void;
  locale?: LandscapeLocale;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function CareActionPicker({
  value,
  onChange,
  locale = "en",
  disabled = false,
  required = true,
  className = "",
}: CareActionPickerProps) {
  const rawId = useId();
  const id = `nf-care-${sanitiseSvgId(rawId)}`;
  const copy = dictionaries[locale].landscape.careActionPicker;

  return (
    <fieldset className={`care-action-picker ${className}`.trim()} aria-describedby={`${id}-prompt`}>
      <legend>{copy.title}</legend>
      <p id={`${id}-prompt`}>{copy.prompt}</p>
      <div className="care-action-picker__grid">
        {CARE_ACTIONS.map((careAction) => {
          const actionCopy = copy.actions[careAction];
          return (
            <label className={`care-action-picker__option care-action-picker__option--${careAction}`} key={careAction}>
              <input
                type="radio"
                name={id}
                value={careAction}
                checked={value === careAction}
                disabled={disabled}
                required={required}
                onChange={() => onChange(careAction)}
              />
              <span>
                <i aria-hidden="true">{actionCopy.symbol}</i>
                <strong>{actionCopy.label}</strong>
                <small>{actionCopy.detail}</small>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
