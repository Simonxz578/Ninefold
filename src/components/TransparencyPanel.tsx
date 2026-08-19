import type { PatternConfiguration } from "../domain/types";
import { useI18n } from "../i18n";

interface TransparencyPanelProps {
  configuration: PatternConfiguration;
}

export function TransparencyPanel({ configuration }: TransparencyPanelProps) {
  const { formatDate, t } = useI18n();
  const versionLabels: Record<PatternConfiguration["variant"], string> = {
    original: t.transparency.original,
    reframe: t.transparency.reframed,
  };
  return (
    <details className="transparency-panel">
      <summary>
        <span>
          <span className="eyebrow">{t.transparency.eyebrow}</span>
          {t.transparency.summary}
        </span>
        <span aria-hidden="true">＋</span>
      </summary>
      <div className="transparency-panel__body">
        <p>{t.transparency.body}</p>
        <dl>
          <div><dt>{t.transparency.reflectionMode}</dt><dd>{t.result.localEngine}</dd></div>
          <div><dt>{t.transparency.generator}</dt><dd>{configuration.generatorVersion}</dd></div>
          <div><dt>{t.transparency.dictionary}</dt><dd>{configuration.dictionaryVersion}</dd></div>
          <div><dt>{t.transparency.localDate}</dt><dd>{formatDate(configuration.date, "numeric")}</dd></div>
          <div><dt>{t.transparency.version}</dt><dd>{versionLabels[configuration.variant]}</dd></div>
          <div className="transparency-panel__seed"><dt>{t.transparency.seed}</dt><dd>{configuration.seed}</dd></div>
        </dl>
        <p className="transparency-panel__note">{t.transparency.seedNote}</p>
      </div>
    </details>
  );
}
