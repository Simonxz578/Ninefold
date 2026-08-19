import type { DailyScores } from "../domain/types";
import { interpolate, useI18n } from "../i18n";

interface ScoreDisplayProps {
  scores: DailyScores;
  context?: "daily" | "weekly";
}

export function ScoreDisplay({ scores, context = "daily" }: ScoreDisplayProps) {
  const { t } = useI18n();
  const scoreLabels: Record<keyof DailyScores, string> = {
    clarity: t.scores.clarity,
    momentum: t.scores.momentum,
    tension: t.scores.tension,
  };
  const scoreDescriptions: Record<
    NonNullable<ScoreDisplayProps["context"]>,
    Record<keyof DailyScores, string>
  > = {
    daily: {
      clarity: t.scores.descriptions.dailyClarity,
      momentum: t.scores.descriptions.dailyMomentum,
      tension: t.scores.descriptions.dailyTension,
    },
    weekly: {
      clarity: t.scores.descriptions.weeklyClarity,
      momentum: t.scores.descriptions.weeklyMomentum,
      tension: t.scores.descriptions.weeklyTension,
    },
  };
  const descriptions = scoreDescriptions[context];
  const ariaLabels: Record<NonNullable<ScoreDisplayProps["context"]>, string> = {
    daily: t.scores.dailyAriaLabel,
    weekly: t.scores.weeklyAriaLabel,
  };
  return (
    <div className="score-grid" aria-label={ariaLabels[context]}>
      {(Object.keys(descriptions) as Array<keyof DailyScores>).map((key) => (
        <article className={`score score--${key}`} key={key}>
          <div className="score__dial" aria-hidden="true" style={{ "--score": scores[key] } as React.CSSProperties}>
            <span>{scores[key]}</span>
          </div>
          <div>
            <h3>{scoreLabels[key]}</h3>
            <p>{descriptions[key]}</p>
          </div>
          <span className="sr-only">
            {interpolate(t.scores.outOfNine, { score: scores[key] })}
          </span>
        </article>
      ))}
    </div>
  );
}
