import { useEffect, useRef, useState, type FormEvent } from "react";
import type {
  Connection,
  DailyCheckIn,
  Focus,
  RatingFive,
} from "../domain/types";

interface CheckInFormProps {
  name?: string;
  initial?: DailyCheckIn;
  onSubmit: (checkIn: DailyCheckIn) => void;
}

const ratingLabels = {
  energy: ["depleted", "low", "steady", "active", "energised"],
  clarity: ["clouded", "uncertain", "forming", "clear", "sharply focused"],
} as const;

const connections: Array<{ value: Connection; label: string; detail: string }> = [
  { value: "inward", label: "Inward", detail: "Quiet attention" },
  { value: "balanced", label: "Balanced", detail: "Between self and others" },
  { value: "outward", label: "Outward", detail: "Engaged with others" },
];

const focuses: Array<{ value: Focus; label: string; mark: string }> = [
  { value: "work", label: "Work", mark: "↗" },
  { value: "study", label: "Study", mark: "⌁" },
  { value: "relationships", label: "Relationships", mark: "∞" },
  { value: "creativity", label: "Creativity", mark: "✦" },
  { value: "self", label: "Self", mark: "○" },
];

export function CheckInForm({ name, initial, onSubmit }: CheckInFormProps) {
  const [energy, setEnergy] = useState<RatingFive | null>(initial?.energy ?? null);
  const [clarity, setClarity] = useState<RatingFive | null>(initial?.clarity ?? null);
  const [connection, setConnection] = useState<Connection | null>(initial?.connection ?? null);
  const [focus, setFocus] = useState<Focus | null>(initial?.focus ?? null);
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus({ preventScroll: false });
  }, [error]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!energy || !clarity || !connection || !focus) {
      setError("Complete energy, clarity, connection, and focus to reveal today’s pattern.");
      return;
    }
    setError("");
    onSubmit({ energy, clarity, connection, focus, note: note.trim() || undefined });
  };

  return (
    <form className="check-in" onSubmit={submit} noValidate>
      <header className="check-in__intro">
        <p className="eyebrow">A brief arrival</p>
        <h2>{name ? `${name}, how is today taking shape?` : "How is today taking shape?"}</h2>
        <p>Choose what is closest—not what feels ideal. There are no good or bad settings.</p>
      </header>

      <RatingField
        legend="Energy"
        description="How much usable energy is available right now?"
        name="energy"
        value={energy}
        labels={ratingLabels.energy}
        onChange={setEnergy}
      />

      <RatingField
        legend="Clarity"
        description="How defined does your next direction feel?"
        name="clarity"
        value={clarity}
        labels={ratingLabels.clarity}
        onChange={setClarity}
      />

      <fieldset className="check-in__section">
        <legend>Connection</legend>
        <p>Where is your attention naturally facing?</p>
        <div className="connection-options">
          {connections.map((option) => (
            <label key={option.value} className={connection === option.value ? "is-selected" : ""}>
              <input
                type="radio"
                name="connection"
                value={option.value}
                checked={connection === option.value}
                onChange={() => setConnection(option.value)}
              />
              <span aria-hidden="true" className={`direction-mark direction-mark--${option.value}`} />
              <strong>{option.label}</strong>
              <small>{option.detail}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="check-in__section">
        <legend>Focus</legend>
        <p>Where would a useful reflection land today?</p>
        <div className="focus-options">
          {focuses.map((option) => (
            <label key={option.value} className={focus === option.value ? "is-selected" : ""}>
              <input
                type="radio"
                name="focus"
                value={option.value}
                checked={focus === option.value}
                onChange={() => setFocus(option.value)}
              />
              <span aria-hidden="true">{option.mark}</span>
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field check-in__note">
        <span>Private note <small>Optional</small></span>
        <textarea
          maxLength={280}
          rows={4}
          value={note}
          placeholder="What is occupying some attention?"
          onChange={(event) => setNote(event.target.value)}
        />
        <span className="field__meta">
          <small>Stays in this browser. Never included in downloads or share captions.</small>
          <small>{note.length}/280</small>
        </span>
      </label>

      {error && (
        <p ref={errorRef} id="check-in-error" className="form-error" role="alert" tabIndex={-1}>
          {error}
        </p>
      )}

      <div className="check-in__submit">
        <button className="button button--primary button--large" type="submit">
          Reveal today’s pattern <span aria-hidden="true">↗</span>
        </button>
        <p>Generated locally · Stable for today</p>
      </div>
    </form>
  );
}

interface RatingFieldProps {
  legend: string;
  description: string;
  name: string;
  value: RatingFive | null;
  labels: readonly string[];
  onChange: (value: RatingFive) => void;
}

function RatingField({ legend, description, name, value, labels, onChange }: RatingFieldProps) {
  return (
    <fieldset className="check-in__section rating-field">
      <legend>{legend}</legend>
      <p>{description}</p>
      <div className="rating-options">
        {labels.map((label, index) => {
          const rating = (index + 1) as RatingFive;
          return (
            <label key={rating} className={value === rating ? "is-selected" : ""}>
              <input
                type="radio"
                name={name}
                value={rating}
                checked={value === rating}
                onChange={() => onChange(rating)}
              />
              <span className="rating-options__number">{rating}</span>
              <span className="rating-options__label">{label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
