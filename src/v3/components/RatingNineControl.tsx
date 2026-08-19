import { useId } from "react";
import { interpolate } from "../../i18n";
import { RATING_NINE_VALUES, type RatingNine } from "../domain";

export interface RatingNineControlProps {
  name: string;
  question: string;
  groupLabel: string;
  lowAnchor: string;
  middleAnchor: string;
  highAnchor: string;
  valueLabel: string;
  instructions: string;
  value: RatingNine | null;
  onChange: (value: RatingNine) => void;
  error?: string;
  disabled?: boolean;
}

export function RatingNineControl({
  name,
  question,
  groupLabel,
  lowAnchor,
  middleAnchor,
  highAnchor,
  valueLabel,
  instructions,
  value,
  onChange,
  error,
  disabled = false,
}: RatingNineControlProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const descriptionId = `v3-rating-${reactId}-description`;
  const errorId = `v3-rating-${reactId}-error`;

  return (
    <fieldset
      className="v3-rating-nine"
      aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}`}
      disabled={disabled}
    >
      <legend>
        <span className="v3-rating-nine__question">{question}</span>
        <span className="sr-only">{groupLabel}</span>
      </legend>

      <p className="sr-only" id={descriptionId}>{instructions}</p>
      <div className="v3-rating-nine__values">
        {RATING_NINE_VALUES.map((rating) => (
          <label
            className={`v3-rating-nine__choice${value === rating ? " is-selected" : ""}`}
            key={rating}
          >
            <input
              type="radio"
              name={name}
              value={rating}
              checked={value === rating}
              aria-label={interpolate(valueLabel, { value: rating })}
              onChange={() => onChange(rating)}
            />
            <span aria-hidden="true">{rating}</span>
          </label>
        ))}
      </div>

      <div className="v3-rating-nine__anchors" aria-hidden="true">
        <span>{lowAnchor}</span>
        <span>{middleAnchor}</span>
        <span>{highAnchor}</span>
      </div>
      {error && <p className="v3-field-error" id={errorId} role="alert">{error}</p>}
    </fieldset>
  );
}
