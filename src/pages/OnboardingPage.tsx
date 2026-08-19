import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { InlineNotice } from "../components/InlineNotice";
import { WorldTree } from "../components/landscape/WorldTree";
import type {
  PathNumber,
  PreferenceLenses,
  Profile,
  ZodiacSign,
} from "../domain/types";
import { PATH_NUMBERS } from "../domain/types";
import { interpolate, localizedPath, useI18n } from "../i18n";

interface OnboardingPageProps {
  profile: Profile | null;
  storageWarning?: string;
  onSave: (profile: Profile) => void;
}

const ZODIAC_SIGNS: ZodiacSign[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

function createProfileId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `profile-${Date.now().toString(36)}-${performance.now().toString(36).replace(".", "")}`;
}

function scrollToPageTop(): void {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

export function OnboardingPage({ profile, storageWarning, onSave }: OnboardingPageProps) {
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [pathNumber, setPathNumber] = useState<PathNumber | null>(profile?.pathNumber ?? null);
  const [zodiac, setZodiac] = useState<ZodiacSign | "">(profile?.zodiacSign ?? "");
  const [lenses, setLenses] = useState<PreferenceLenses>(
    profile?.lenses ?? {
      orientation: "neutral",
      approach: "neutral",
      processing: "neutral",
      pace: "neutral",
    },
  );
  const [error, setError] = useState("");
  const selectedPath = pathNumber ? t.paths[pathNumber] : null;
  const steps = [
    t.onboarding.steps.name,
    t.onboarding.steps.path,
    t.onboarding.steps.lenses,
    t.onboarding.steps.planting,
  ];

  const goForward = () => {
    if (step === 2 && !pathNumber) {
      setError(t.onboarding.path.chooseError);
      return;
    }
    setError("");
    setStep((value) => Math.min(4, value + 1));
    scrollToPageTop();
  };

  const goBack = () => {
    setError("");
    setStep((value) => Math.max(1, value - 1));
    scrollToPageTop();
  };

  const save = () => {
    if (!pathNumber) {
      setStep(2);
      setError(t.onboarding.path.chooseError);
      return;
    }
    onSave({
      id: profile?.id ?? createProfileId(),
      displayName: displayName.trim() || undefined,
      pathNumber,
      zodiacSign: zodiac || undefined,
      lenses,
      createdAt: profile?.createdAt ?? new Date().toISOString(),
    });
    navigate(localizedPath("/today", locale));
  };

  return (
    <div className="page onboarding-page">
      <header className="onboarding-header container">
        <div>
          <p className="eyebrow">{t.onboarding.eyebrow}</p>
          <h1>{profile ? t.onboarding.editTitle : t.onboarding.newTitle}</h1>
        </div>
        <div className="step-count" aria-live="polite">
          {interpolate(t.onboarding.stepOf, { current: step, total: 4 })}
        </div>
      </header>

      {storageWarning && (
        <div className="container"><InlineNotice tone="warning" live>{storageWarning}</InlineNotice></div>
      )}

      <nav className="step-nav container" aria-label={t.onboarding.progressLabel}>
        {steps.map((label, index) => {
          const number = index + 1;
          return (
            <button
              key={label}
              type="button"
              className={step === number ? "is-current" : step > number ? "is-complete" : ""}
              aria-current={step === number ? "step" : undefined}
              disabled={number > step || (number > 2 && !pathNumber)}
              onClick={() => setStep(number)}
            >
              <span>{number}</span>{label}
            </button>
          );
        })}
      </nav>

      <div className="onboarding-body container">
        {step === 1 && (
          <section className="onboarding-step" aria-labelledby="name-step-title">
            <p className="eyebrow">{t.onboarding.name.eyebrow}</p>
            <h2 id="name-step-title">{t.onboarding.name.title}</h2>
            <p className="step-intro">{t.onboarding.name.intro}</p>
            <label className="field field--large">
              <span>{t.onboarding.name.label}</span>
              <input
                type="text"
                value={displayName}
                maxLength={40}
                autoComplete="nickname"
                placeholder={t.onboarding.name.placeholder}
                onChange={(event) => setDisplayName(event.target.value)}
              />
              <small>{interpolate(t.onboarding.name.counter, { count: displayName.length })}</small>
            </label>
            <div className="privacy-note">
              <span aria-hidden="true">◌</span>
              <p>{t.onboarding.name.privacy}</p>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="onboarding-step onboarding-step--wide" aria-labelledby="path-step-title">
            <p className="eyebrow">{t.onboarding.path.eyebrow}</p>
            <h2 id="path-step-title">{t.onboarding.path.title}</h2>
            <p className="step-intro">{t.onboarding.path.intro}</p>
            <p className="reframe-intro">{t.onboarding.path.explanation}</p>
            <div className="path-layout">
              <div className="path-grid" role="radiogroup" aria-label={t.onboarding.path.groupLabel}>
                {PATH_NUMBERS.map((number) => {
                  const path = t.paths[number];
                  return (
                    <label key={number} className={`path-choice${pathNumber === number ? " is-selected" : ""}`}>
                      <input
                        type="radio"
                        name="path-number"
                        value={number}
                        checked={pathNumber === number}
                        onChange={() => {
                          setPathNumber(number);
                          setError("");
                        }}
                      />
                      <svg className="path-choice__preview" viewBox="320 110 560 590" aria-hidden="true">
                        <WorldTree path={number} growth={0.54} eventCount={3} idPrefix={`path-preview-${number}`} />
                      </svg>
                      <span className="path-choice__number">{number}</span>
                      <span className="path-choice__name">{path.name}</span>
                      <span className="path-choice__keywords">{path.keywords}</span>
                    </label>
                  );
                })}
              </div>
              <aside className="path-detail" aria-live="polite">
                {selectedPath && pathNumber ? (
                  <>
                    <span className="path-detail__number">{pathNumber}</span>
                    <p className="eyebrow">{selectedPath.name}</p>
                    <h3>{selectedPath.keywords}</h3>
                    <dl>
                      <div><dt>{t.onboarding.path.constructiveLabel}</dt><dd>{selectedPath.constructive}</dd></div>
                      <div><dt>{t.onboarding.path.tensionLabel}</dt><dd>{selectedPath.tension}</dd></div>
                      <div><dt>{t.onboarding.path.growthLabel}</dt><dd>{selectedPath.growth}</dd></div>
                    </dl>
                  </>
                ) : <p>{t.onboarding.path.intro}</p>}
              </aside>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="onboarding-step onboarding-step--wide" aria-labelledby="lenses-step-title">
            <p className="eyebrow">{t.onboarding.lenses.eyebrow}</p>
            <h2 id="lenses-step-title">{t.onboarding.lenses.title}</h2>
            <p className="step-intro">{t.onboarding.lenses.intro}</p>
            <div className="lens-layout">
              <label className="field">
                <span>{t.onboarding.lenses.zodiacLabel} <small>{t.common.optional}</small></span>
                <select value={zodiac} onChange={(event) => setZodiac(event.target.value as ZodiacSign | "")}>
                  <option value="">{t.onboarding.lenses.zodiacPlaceholder}</option>
                  {ZODIAC_SIGNS.map((sign) => <option key={sign} value={sign}>{t.zodiac[sign]}</option>)}
                </select>
                <small>{t.onboarding.lenses.zodiacHelp}</small>
              </label>
              <div className="lens-pairs">
                <LensOptions
                  name="orientation"
                  label={t.onboarding.lenses.orientation}
                  value={lenses.orientation ?? "neutral"}
                  options={[
                    ["internal", t.onboarding.lenses.internal],
                    ["neutral", t.onboarding.lenses.neutral],
                    ["external", t.onboarding.lenses.external],
                  ]}
                  onChange={(value) => setLenses((current) => ({ ...current, orientation: value }))}
                />
                <LensOptions
                  name="approach"
                  label={t.onboarding.lenses.approach}
                  value={lenses.approach ?? "neutral"}
                  options={[
                    ["structured", t.onboarding.lenses.structured],
                    ["neutral", t.onboarding.lenses.neutral],
                    ["exploratory", t.onboarding.lenses.exploratory],
                  ]}
                  onChange={(value) => setLenses((current) => ({ ...current, approach: value }))}
                />
                <LensOptions
                  name="processing"
                  label={t.onboarding.lenses.processing}
                  value={lenses.processing ?? "neutral"}
                  options={[
                    ["analytical", t.onboarding.lenses.analytical],
                    ["neutral", t.onboarding.lenses.neutral],
                    ["intuitive", t.onboarding.lenses.intuitive],
                  ]}
                  onChange={(value) => setLenses((current) => ({ ...current, processing: value }))}
                />
                <LensOptions
                  name="pace"
                  label={t.onboarding.lenses.pace}
                  value={lenses.pace ?? "neutral"}
                  options={[
                    ["stable", t.onboarding.lenses.stable],
                    ["neutral", t.onboarding.lenses.neutral],
                    ["adaptive", t.onboarding.lenses.adaptive],
                  ]}
                  onChange={(value) => setLenses((current) => ({ ...current, pace: value }))}
                />
              </div>
            </div>
          </section>
        )}

        {step === 4 && pathNumber && selectedPath && (
          <section className="onboarding-step onboarding-confirmation" aria-labelledby="confirm-step-title">
            <div className="confirmation-visual">
              <svg viewBox="320 100 560 610" role="img" aria-label={`${selectedPath.name} · ${selectedPath.growth}`}>
                <WorldTree path={pathNumber} growth={0.68} eventCount={5} idPrefix="profile-world-tree" />
              </svg>
              <span className="confirmation-visual__label">{t.brand.worldTree}</span>
            </div>
            <div className="confirmation-copy">
              <p className="eyebrow">{t.onboarding.planting.eyebrow}</p>
              <h2 id="confirm-step-title">{t.onboarding.planting.title}</h2>
              <p>{t.onboarding.planting.intro}</p>
              <h3>{pathNumber} · {selectedPath.name}</h3>
              <p className="confirmation-copy__keywords">{selectedPath.keywords}</p>
              <dl className="profile-summary">
                <div><dt>{t.onboarding.planting.selectedPath}</dt><dd>{selectedPath.growth}</dd></div>
                <div><dt>{t.onboarding.planting.optionalLenses}</dt><dd>{zodiac ? t.zodiac[zodiac] : t.common.notSelected}</dd></div>
              </dl>
              <p className="reframe-intro">{t.onboarding.planting.privacy}</p>
            </div>
          </section>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="onboarding-actions">
          {step > 1 ? <button className="button button--secondary" type="button" onClick={goBack}>{t.common.back}</button> : <span />}
          {step < 4 ? (
            <button className="button button--primary" type="button" onClick={goForward}>
              {t.common.continue} <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button className="button button--primary" type="button" onClick={save}>
              {profile ? t.onboarding.planting.updateCta : t.onboarding.planting.cta} <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface LensOptionsProps<T extends string> {
  name: string;
  label: string;
  value: T;
  options: ReadonlyArray<readonly [T, string]>;
  onChange: (value: T) => void;
  children?: ReactNode;
}

function LensOptions<T extends string>({ name, label, value, options, onChange }: LensOptionsProps<T>) {
  return (
    <fieldset className="segmented-field">
      <legend>{label}</legend>
      <div className="segmented-control">
        {options.map(([optionValue, optionLabel]) => (
          <label key={optionValue}>
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
            />
            <span>{optionLabel}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
