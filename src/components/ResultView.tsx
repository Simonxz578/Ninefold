import { formatReflectionForLocale } from "../domain";
import { getColorSymbol } from "../domain/symbols";
import type {
  DailyEntry,
  FeedbackChoice,
  PatternVariant,
} from "../domain/types";
import { useI18n } from "../i18n";
import { FeedbackPanel } from "./FeedbackPanel";
import { PatternArt } from "./PatternArt";
import { ScoreDisplay } from "./ScoreDisplay";
import { ShareActions } from "./ShareActions";
import { TransparencyPanel } from "./TransparencyPanel";

interface ResultViewProps {
  entry: DailyEntry;
  dateLabel?: string;
  historical?: boolean;
  onRequestReframe?: () => void;
  onSwitchVariant?: (variant: PatternVariant) => void;
  onFeedback?: (choice: FeedbackChoice) => { ok: boolean; message?: string };
  shareCaption: string;
}

function resultClassName(historical: boolean): string {
  const classNames = ["result-view", "result-view--living"];
  if (historical) classNames.push("result-view--historical");
  return classNames.join(" ");
}

export function ResultView({
  entry,
  dateLabel,
  historical = false,
  onRequestReframe,
  onSwitchVariant,
  onFeedback,
  shareCaption,
}: ResultViewProps) {
  const { formatDate, locale, t } = useI18n();
  const variant: PatternVariant = entry.activeVariant === "reframe" && entry.reframe
    ? "reframe"
    : "original";
  const version = variant === "reframe" && entry.reframe ? entry.reframe : entry.original;
  const configuration = version.configuration;
  const reflection = formatReflectionForLocale({
    path: configuration.pathNumber,
    checkIn: entry.checkIn,
    configuration,
  }, locale);
  const primaryColor = getColorSymbol(configuration.primaryColor);
  const primaryColorName = t.symbols.colours[configuration.primaryColor];
  const secondaryColorName = t.symbols.colours[configuration.secondaryColor];
  const formName = t.symbols.forms[configuration.form];
  const directionName = t.symbols.directions[configuration.direction];
  const pathName = t.paths[configuration.pathNumber].name;
  const dailyNumberName = t.paths[configuration.dailyNumber].name;
  const connection = t.attunement.connections[entry.checkIn.connection];
  const focusName = t.attunement.focuses[entry.checkIn.focus];
  const energyDescription = t.attunement.energyLevels[entry.checkIn.energy - 1];
  const clarityDescription = t.attunement.clarityLevels[entry.checkIn.clarity - 1];
  const svgId = `ninefold-${entry.date}-${variant}`;
  const variantLabels: Record<PatternVariant, string> = {
    original: t.today.reflect.originalView,
    reframe: t.today.reflect.alternateView,
  };
  const reframeButtonLabel = entry.reframeUsed
    ? t.today.reflect.reframeUsed
    : t.today.reflect.viewAnotherAngle;

  return (
    <div className={resultClassName(historical)}>
      <section className="result-hero container" aria-labelledby={`result-title-${entry.date}`}>
        <div className="result-hero__visual">
          <div className="result-hero__meta">
            <span>{dateLabel ?? formatDate(entry.date)}</span>
            <span>{variantLabels[variant]}</span>
          </div>
          <PatternArt
            pattern={configuration}
            id={svgId}
            animated={!historical}
            title={t.accessibility.dailySigilTitle}
            description={t.accessibility.dailySigilDescription}
          />
          <div className="result-hero__number" aria-hidden="true">{configuration.dailyNumber}</div>
        </div>

        <div className="result-hero__copy result-reflection reveal-stage reveal-stage--one">
          <p className="eyebrow">{t.today.reflect.eyebrow}</p>
          <h2 id={`result-title-${entry.date}`} className="result-reflection__lead">
            {reflection.tension}
          </h2>

          <div className="reflection-action result-reflection__action">
            <p className="eyebrow">{t.today.reflect.actionLabel}</p>
            <p>{reflection.action}</p>
          </div>

          <div className="reflection-question result-reflection__question">
            <span aria-hidden="true">?</span>
            <div>
              <small>{t.today.reflect.questionLabel}</small>
              <p>{reflection.reflectionQuestion}</p>
            </div>
          </div>

          {entry.reframe ? (
            <fieldset className="version-switcher">
              <legend>{t.today.reflect.viewAnotherAngle}</legend>
              <div className="segmented-control">
                <label>
                  <input
                    type="radio"
                    name={`variant-${entry.date}`}
                    checked={variant === "original"}
                    onChange={() => onSwitchVariant?.("original")}
                  />
                  <span>{t.today.reflect.originalView}</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name={`variant-${entry.date}`}
                    checked={variant === "reframe"}
                    onChange={() => onSwitchVariant?.("reframe")}
                  />
                  <span>{t.today.reflect.alternateView}</span>
                </label>
              </div>
              <small>{t.today.reflect.differentNotBetter}</small>
            </fieldset>
          ) : !historical ? (
            <div className="reframe-callout">
              <div>
                <span className="eyebrow">{t.today.reflect.viewAnotherAngle}</span>
                <p>{t.today.reflect.reframeExplanation}</p>
              </div>
              <button
                className="button button--secondary"
                type="button"
                onClick={onRequestReframe}
                disabled={entry.reframeUsed}
              >
                {reframeButtonLabel}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <details className="result-details container" open={historical}>
        <summary className="result-details__summary">
          <span>
            <span className="eyebrow">{t.result.dailySigil}</span>
            {t.today.reflect.detailsSummary}
          </span>
          <span aria-hidden="true">＋</span>
        </summary>

        <div className="result-details__body">
          <section className="result-symbols" aria-labelledby={`symbols-title-${entry.date}`}>
            <div className="section-heading section-heading--inline">
              <div>
                <p className="eyebrow">{t.result.dailySigil}</p>
                <h3 id={`symbols-title-${entry.date}`}>{reflection.theme}</h3>
              </div>
              <p>{t.result.sigilDescription}</p>
            </div>
            <div className="symbol-reveal" aria-label={t.result.generatedSymbols}>
              <div>
                <span>{t.result.number}</span>
                <strong>{configuration.dailyNumber}</strong>
                <small>{dailyNumberName}</small>
              </div>
              <div>
                <span>{t.result.colour}</span>
                <i style={{ backgroundColor: primaryColor.hex }} aria-hidden="true" />
                <strong>{primaryColorName}</strong>
                <small>{secondaryColorName}</small>
              </div>
              <div>
                <span>{t.result.form}</span>
                <i className={`form-glyph form-glyph--${configuration.form}`} aria-hidden="true" />
                <strong>{formName}</strong>
                <small>{directionName}</small>
              </div>
            </div>
          </section>

          <section className="score-section reveal-stage reveal-stage--two" aria-labelledby={`scores-title-${entry.date}`}>
            <div className="section-heading section-heading--inline">
              <div>
                <p className="eyebrow">{t.result.scores}</p>
                <h3 id={`scores-title-${entry.date}`}>{t.scores.dailyAriaLabel}</h3>
              </div>
            </div>
            <ScoreDisplay scores={configuration.scores} />
          </section>

          <section className="reflection-section reveal-stage reveal-stage--three" aria-labelledby={`reflection-details-title-${entry.date}`}>
            <div className="reflection-section__heading">
              <p className="eyebrow">{t.result.reflectionMode}</p>
              <h3 id={`reflection-details-title-${entry.date}`}>{t.today.reflect.detailsSummary}</h3>
              <span>{t.result.localEngine}</span>
            </div>
            <div className="reflection-layout">
              <article className="reflection-main">
                <p className="reflection-main__theme">{reflection.theme}</p>
                <div className="reflection-evidence">
                  <p>{reflection.evidence[0]}</p>
                  <p>{reflection.evidence[1]}</p>
                </div>
                <dl>
                  <div>
                    <dt>{t.result.tension}</dt>
                    <dd>{reflection.tension}</dd>
                  </div>
                  <div>
                    <dt>{t.result.opportunity}</dt>
                    <dd>{reflection.opportunity}</dd>
                  </div>
                </dl>
              </article>
            </div>
            <p className="reflection-disclaimer">{reflection.disclaimer}</p>
          </section>

          <section className="based-on" aria-labelledby={`based-on-title-${entry.date}`}>
            <div>
              <p className="eyebrow">{t.transparency.eyebrow}</p>
              <h3 id={`based-on-title-${entry.date}`}>{t.result.basedOn}</h3>
            </div>
            <dl className="based-on__grid">
              <div>
                <dt>{t.today.attune.energy}</dt>
                <dd>{entry.checkIn.energy}/5 · {energyDescription}</dd>
              </div>
              <div>
                <dt>{t.today.attune.clarity}</dt>
                <dd>{entry.checkIn.clarity}/5 · {clarityDescription}</dd>
              </div>
              <div><dt>{t.today.attune.connection}</dt><dd>{connection.label} · {connection.detail}</dd></div>
              <div><dt>{t.today.attune.focus}</dt><dd>{focusName}</dd></div>
              <div><dt>{t.result.path}</dt><dd>{configuration.pathNumber} · {pathName}</dd></div>
              <div><dt>{t.result.number}</dt><dd>{configuration.dailyNumber} · {dailyNumberName}</dd></div>
              <div>
                <dt>{t.result.colour}</dt>
                <dd><i style={{ backgroundColor: primaryColor.hex }} /> {primaryColorName} + {secondaryColorName}</dd>
              </div>
              <div><dt>{t.result.form} · {t.result.direction}</dt><dd>{formName} · {directionName}</dd></div>
            </dl>
          </section>

          <TransparencyPanel configuration={configuration} />
        </div>
      </details>

      {!historical && (
        <div className="result-extras container">
          <ShareActions
            svgId={svgId}
            filename={`ninefold-${entry.date}-${variant}.svg`}
            caption={shareCaption}
          />
          {onFeedback && (
            <FeedbackPanel selected={entry.feedback} onSelect={onFeedback} />
          )}
        </div>
      )}
    </div>
  );
}
