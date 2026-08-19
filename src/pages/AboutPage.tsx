import { useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { InlineNotice } from "../components/InlineNotice";
import { useI18n } from "../i18n";

interface AboutPageProps {
  hasLocalData: boolean;
  storageWarning?: string;
  onClearData: () => void;
}

export function AboutPage({ hasLocalData, storageWarning, onClearData }: AboutPageProps) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const { t } = useI18n();
  const sections = [
    t.method.sections.whatIs,
    t.method.sections.landscape,
    t.method.sections.shapesToday,
    t.method.sections.deterministic,
    t.method.sections.path,
    t.method.sections.sigils,
    t.method.sections.reframe,
    t.method.sections.boundaries,
    t.method.sections.data,
    t.method.sections.future,
  ] as const;
  const formula = [
    t.method.formula.path,
    t.method.formula.state,
    t.method.formula.care,
    t.method.formula.trace,
    t.method.formula.time,
    t.method.formula.language,
  ] as const;

  const clear = () => {
    setConfirmingClear(false);
    onClearData();
  };

  return (
    <div className="page method-page">
      <header className="page-hero container page-hero--narrow">
        <p className="eyebrow">{t.method.eyebrow}</p>
        <h1>{t.method.title}</h1>
        <p>{t.method.intro}</p>
      </header>

      {storageWarning && <div className="container"><InlineNotice tone="warning" live>{storageWarning}</InlineNotice></div>}

      <section className="method-grid container method-grid--v2" aria-label={t.method.eyebrow}>
        {sections.map((section, index) => (
          <article
            className={`method-card method-card--v2${index === 0 ? " method-card--wide" : ""}`}
            key={section.title}
          >
            <span className="method-card__number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </div>
          </article>
        ))}
      </section>

      <section
        className="method-formula container limitations limitations--v2"
        aria-labelledby="method-formula-title"
      >
        <h2 id="method-formula-title">{t.method.formulaTitle}</h2>
        <ol className="method-formula__list" aria-label={t.method.formulaTitle}>
          {formula.map((item, index) => (
            <li className="method-formula__item" key={item}>
              <span className="method-card__number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p>{item}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="privacy-panel container" aria-labelledby="privacy-title">
        <div>
          <p className="eyebrow">{t.method.privacyEyebrow}</p>
          <h2 id="privacy-title">{t.method.privacyTitle}</h2>
        </div>
        <div className="privacy-panel__details">
          <p>{t.method.privacyBody}</p>
          <p>{t.method.privateNoteBody}</p>
          <button
            className="button button--secondary"
            type="button"
            disabled={!hasLocalData}
            onClick={() => setConfirmingClear(true)}
          >
            {hasLocalData ? t.method.clearData : t.method.noData}
          </button>
        </div>
      </section>

      <section className="limitations container" aria-labelledby="limits-title">
        <p className="eyebrow">{t.method.limitsEyebrow}</p>
        <h2 id="limits-title">{t.method.limitsTitle}</h2>
        <div className="limitations__columns">
          <p>{t.method.limitsBody}</p>
          <div>
            <p>{t.brand.safety}</p>
            <p>{t.transparency.body}</p>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={confirmingClear}
        title={t.storage.clearTitle}
        description={t.storage.clearDescription}
        confirmLabel={t.storage.clearConfirm}
        cancelLabel={t.common.cancel}
        tone="danger"
        onCancel={() => setConfirmingClear(false)}
        onConfirm={clear}
      />
    </div>
  );
}
