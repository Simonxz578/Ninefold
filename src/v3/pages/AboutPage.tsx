import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { localizedPath } from "../../i18n";
import { useV3App } from "../V3App";
import { V3Shell } from "../components/V3Shell";

export function AboutPage() {
  const { locale, copy, state, resetV3 } = useV3App();
  const navigate = useNavigate();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [error, setError] = useState("");
  const resetTriggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirmingReset) cancelRef.current?.focus();
  }, [confirmingReset]);

  const closeConfirmation = () => {
    setConfirmingReset(false);
    window.setTimeout(() => resetTriggerRef.current?.focus(), 0);
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeConfirmation();
      return;
    }
    if (event.key !== "Tab") return;
    const first = cancelRef.current;
    const last = confirmRef.current;
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const clearWorld = () => {
    if (!resetV3()) {
      setError(copy.errors.storageWrite);
      setConfirmingReset(false);
      resetTriggerRef.current?.focus();
      return;
    }
    navigate(localizedPath("/", locale), { replace: true });
  };

  return (
    <V3Shell>
      <article className="v3-page v3-about">
        <header className="v3-about__header">
          <p className="v3-eyebrow">{copy.about.eyebrow}</p>
          <h1>{copy.about.title}</h1>
          <p>{copy.about.intro}</p>
        </header>

        <section className="v3-about__truths" aria-labelledby="v3-about-truths-heading">
          <h2 id="v3-about-truths-heading">{copy.about.truthsHeading}</h2>
          <ol>
            {copy.about.truthClaims.map((claim) => <li key={claim}>{claim}</li>)}
          </ol>
        </section>

        <div className="v3-about__principles">
          <section aria-labelledby="v3-about-privacy-heading">
            <h2 id="v3-about-privacy-heading">{copy.about.privacyHeading}</h2>
            <p>{copy.about.privacyBody}</p>
          </section>
          <section aria-labelledby="v3-about-boundaries-heading">
            <h2 id="v3-about-boundaries-heading">{copy.about.boundariesHeading}</h2>
            <p>{copy.about.boundariesBody}</p>
          </section>
        </div>

        {state && (
          <section className="v3-about__reset" aria-labelledby="v3-about-reset-heading">
            <h2 id="v3-about-reset-heading">{copy.about.clearHeading}</h2>
            <p>{copy.about.clearBody}</p>
            {error && <p className="v3-field-error" role="alert">{error}</p>}
            <button
              className="v3-destructive-action"
              ref={resetTriggerRef}
              type="button"
              onClick={() => {
                setError("");
                setConfirmingReset(true);
              }}
            >
              {copy.about.clearAction}
            </button>
          </section>
        )}

        {confirmingReset && (
          <div className="v3-confirmation-backdrop">
            <div
              className="v3-confirmation"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="v3-reset-confirm-title"
              aria-describedby="v3-reset-confirm-body"
              onKeyDown={handleDialogKeyDown}
            >
              <h2 id="v3-reset-confirm-title">{copy.about.clearConfirmTitle}</h2>
              <p id="v3-reset-confirm-body">{copy.about.clearConfirmBody}</p>
              <div className="v3-actions">
                <button ref={cancelRef} type="button" onClick={closeConfirmation}>
                  {copy.common.cancel}
                </button>
                <button className="v3-destructive-action" ref={confirmRef} type="button" onClick={clearWorld}>
                  {copy.about.clearConfirmAction}
                </button>
              </div>
            </div>
          </div>
        )}
      </article>
    </V3Shell>
  );
}
