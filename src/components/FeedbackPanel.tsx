import { useState } from "react";
import type { FeedbackChoice } from "../domain/types";
import { useI18n } from "../i18n";

interface FeedbackPanelProps {
  selected?: FeedbackChoice;
  onSelect: (choice: FeedbackChoice) => { ok: boolean; message?: string };
}

type FeedbackStatus = "idle" | "saved" | "failed";

export function FeedbackPanel({ selected, onSelect }: FeedbackPanelProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<FeedbackStatus>(selected ? "saved" : "idle");
  const choices: Array<{ value: FeedbackChoice; label: string }> = [
    { value: "useful", label: t.feedback.useful },
    { value: "too-generic", label: t.feedback.tooGeneric },
    { value: "too-negative", label: t.feedback.tooNegative },
    { value: "did-not-match", label: t.feedback.didNotMatch },
  ];
  const statusMessages: Record<Exclude<FeedbackStatus, "idle">, string> = {
    saved: t.feedback.saved,
    failed: t.feedback.saveFailed,
  };

  const select = (choice: FeedbackChoice) => {
    const result = onSelect(choice);
    setStatus(result.ok ? "saved" : "failed");
  };

  return (
    <section className="feedback-panel" aria-labelledby="feedback-title">
      <div>
        <p className="eyebrow">{t.feedback.eyebrow}</p>
        <h2 id="feedback-title">{t.feedback.title}</h2>
      </div>
      <div className="feedback-options" role="group" aria-label={t.feedback.title}>
        {choices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            className={selected === choice.value ? "is-selected" : ""}
            aria-pressed={selected === choice.value}
            onClick={() => select(choice.value)}
          >
            {choice.label}
          </button>
        ))}
      </div>
      <p className="feedback-confirmation" role="status" aria-live="polite">
        {status === "idle" ? "" : statusMessages[status]}
      </p>
    </section>
  );
}
