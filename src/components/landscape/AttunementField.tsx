import { useId, type CSSProperties } from "react";
import type {
  Connection,
  DailyCheckIn,
  Focus,
  LandscapeLocale,
  RatingFive,
} from "../../domain/types";
import { dictionaries, interpolate } from "../../i18n";
import "../../living-world.css";
import { sanitiseSvgId } from "./geometry";

const CONNECTIONS: readonly Connection[] = ["inward", "balanced", "outward"];
const FOCUSES: readonly Focus[] = ["work", "study", "relationships", "creativity", "self"];

export interface AttunementFieldProps {
  value: DailyCheckIn;
  onChange: (next: DailyCheckIn) => void;
  locale?: LandscapeLocale;
  disabled?: boolean;
  showNote?: boolean;
  className?: string;
}

export function AttunementField({
  value,
  onChange,
  locale = "en",
  disabled = false,
  showNote = true,
  className = "",
}: AttunementFieldProps) {
  const rawId = useId();
  const id = `nf-attunement-${sanitiseSvgId(rawId)}`;
  const copy = dictionaries[locale].landscape.attunementField;
  const attunementStyle = {
    "--nf-attune-x": value.connection === "inward" ? "18%" : value.connection === "outward" ? "82%" : "50%",
    "--nf-attune-y": `${82 - ((value.clarity - 1) / 4) * 64}%`,
    "--nf-attune-size": `${2.1 + ((value.energy - 1) / 4) * 1.8}rem`,
    "--nf-attune-clouds": `${0.78 - ((value.clarity - 1) / 4) * 0.56}`,
  } as CSSProperties;

  return (
    <section className={`attunement-field ${className}`.trim()} aria-labelledby={`${id}-title`}>
      <header className="attunement-field__header">
        <h2 id={`${id}-title`}>{copy.legend}</h2>
        <p>{copy.introduction}</p>
      </header>
      <div className="attunement-field__sky" style={attunementStyle} aria-hidden="true">
        <span className="attunement-field__sky-cloud attunement-field__sky-cloud--one" />
        <span className="attunement-field__sky-cloud attunement-field__sky-cloud--two" />
        <span className="attunement-field__sky-horizon" />
        <span className="attunement-field__orb" />
      </div>
      <RatingGroup
        id={`${id}-energy`}
        label={copy.energy}
        hint={copy.energyHint}
        name={`${id}-energy`}
        value={value.energy}
        labels={copy.ratingLabels}
        disabled={disabled}
        onChange={(energy) => onChange({ ...value, energy })}
      />
      <RatingGroup
        id={`${id}-clarity`}
        label={copy.clarity}
        hint={copy.clarityHint}
        name={`${id}-clarity`}
        value={value.clarity}
        labels={copy.ratingLabels}
        disabled={disabled}
        onChange={(clarity) => onChange({ ...value, clarity })}
      />
      <ChoiceGroup
        id={`${id}-connection`}
        label={copy.connection}
        hint={copy.connectionHint}
        name={`${id}-connection`}
        options={CONNECTIONS}
        value={value.connection}
        labels={copy.options}
        disabled={disabled}
        onChange={(connection) => onChange({ ...value, connection })}
      />
      <ChoiceGroup
        id={`${id}-focus`}
        label={copy.focus}
        hint={copy.focusHint}
        name={`${id}-focus`}
        options={FOCUSES}
        value={value.focus}
        labels={copy.options}
        disabled={disabled}
        onChange={(focus) => onChange({ ...value, focus })}
      />
      {showNote && (
        <label className="attunement-field__note">
          <span><strong>{copy.note}</strong><small>{copy.private}</small></span>
          <textarea
            value={value.note ?? ""}
            rows={3}
            maxLength={280}
            disabled={disabled}
            placeholder={copy.noteHint}
            onChange={(event) => onChange({ ...value, note: event.target.value || undefined })}
          />
          <small className="attunement-field__count">
            {interpolate(copy.noteCount, { count: value.note?.length ?? 0 })}
          </small>
        </label>
      )}
    </section>
  );
}

interface RatingGroupProps {
  id: string;
  label: string;
  hint: string;
  name: string;
  value: RatingFive;
  labels: readonly string[];
  disabled: boolean;
  onChange: (value: RatingFive) => void;
}

function RatingGroup({ id, label, hint, name, value, labels, disabled, onChange }: RatingGroupProps) {
  return (
    <fieldset className="attunement-field__group" aria-describedby={`${id}-hint`}>
      <legend>{label}</legend>
      <p id={`${id}-hint`}>{hint}</p>
      <div className="attunement-field__ratings">
        {labels.map((ratingLabel, index) => {
          const rating = (index + 1) as RatingFive;
          return (
            <label key={rating}>
              <input
                type="radio"
                name={name}
                value={rating}
                checked={value === rating}
                disabled={disabled}
                onChange={() => onChange(rating)}
              />
              <span><strong>{rating}</strong><small>{ratingLabel}</small></span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

interface ChoiceGroupProps<T extends string> {
  id: string;
  label: string;
  hint: string;
  name: string;
  options: readonly T[];
  value: T;
  labels: Readonly<Record<T, string>>;
  disabled: boolean;
  onChange: (value: T) => void;
}

function ChoiceGroup<T extends string>({ id, label, hint, name, options, value, labels, disabled, onChange }: ChoiceGroupProps<T>) {
  return (
    <fieldset className="attunement-field__group" aria-describedby={`${id}-hint`}>
      <legend>{label}</legend>
      <p id={`${id}-hint`}>{hint}</p>
      <div className="attunement-field__choices">
        {options.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              disabled={disabled}
              onChange={() => onChange(option)}
            />
            <span>{labels[option]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
