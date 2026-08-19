import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { interpolate, localizedPath } from "../../i18n";
import { useV3App } from "../V3App";
import { V3Shell } from "../components/V3Shell";
import { WorldScene } from "../components/WorldScene";
import {
  derivePersonalityPreferences,
  type CloudArchetype,
  type PreferenceAnswersV3,
} from "../domain";
import {
  V3_PREFERENCE_QUESTION_IDS,
  type V3PersonalityDimensionId,
  type V3PreferenceQuestionId,
} from "../copy";
import type { CloudArchetype as SceneCloudArchetype } from "../worldData";

const SCENE_CLOUDS: Readonly<Record<CloudArchetype, SceneCloudArchetype>> = {
  "high-veils": "high",
  "layered-horizon": "layered",
  "soft-cumulus": "soft",
  "wind-drawn": "flowing",
};

export function PreferencesPage() {
  const { locale, copy, state, todayCheckIn, updatePreferences, newLeafIndex } = useV3App();
  const [editing, setEditing] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<PreferenceAnswersV3 | null>(() => (
    state ? answersFromState(state.profile.personality) : null
  ));
  const [notice, setNotice] = useState("");
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!state || editing) return;
    setAnswers(answersFromState(state.profile.personality));
  }, [editing, state]);

  useEffect(() => {
    if (editing) questionHeadingRef.current?.focus();
  }, [editing, questionIndex]);

  if (!state || !answers) return <Navigate replace to={localizedPath("/", locale)} />;

  const { profile, meditation } = state;
  const questionId = V3_PREFERENCE_QUESTION_IDS[questionIndex];
  const question = questionId ? copy.preferences.questions[questionId] : null;
  const selectedValue = questionId ? preferenceValue(answers, questionId) : null;
  const preview = derivePersonalityPreferences(answers);

  const startEditing = () => {
    setAnswers(answersFromState(profile.personality));
    setQuestionIndex(0);
    setNotice("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setAnswers(answersFromState(profile.personality));
    setQuestionIndex(0);
    setEditing(false);
  };

  const advance = () => {
    if (!selectedValue) {
      setNotice(copy.errors.choosePreference);
      return;
    }
    setNotice("");
    setQuestionIndex((current) => Math.min(V3_PREFERENCE_QUESTION_IDS.length - 1, current + 1));
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!updatePreferences(answers)) {
      setNotice(copy.errors.storageWrite);
      return;
    }
    setEditing(false);
    setNotice(copy.preferenceSettings.saved);
  };

  return (
    <V3Shell>
      <article className="v3-page v3-preference-settings">
        <header className="v3-preference-settings__header">
          <p className="v3-eyebrow">{copy.preferenceSettings.eyebrow}</p>
          <h1>{copy.preferenceSettings.title}</h1>
          <p>{copy.preferenceSettings.intro}</p>
        </header>

        <section className="v3-preference-settings__world" aria-label={copy.accessibility.worldScene}>
          <WorldScene
            stage="today"
            path={profile.worldPrototype}
            cloud={SCENE_CLOUDS[profile.cloudArchetype]}
            zodiac={profile.zodiacSign}
            mood={todayCheckIn?.mood ?? 5}
            energy={todayCheckIn?.energy ?? 5}
            leafCount={meditation.leafCount}
            newLeafIndex={newLeafIndex}
            stableSeed={profile.stableSeed}
            title={copy.accessibility.worldScene}
            description={meditation.leafCount > 0
              ? interpolate(copy.accessibility.treeWithLeaves, { count: meditation.leafCount })
              : copy.accessibility.bareTree}
            compact
          />
        </section>

        <section className="v3-preference-settings__content" aria-labelledby="v3-current-preferences">
          <h2 id="v3-current-preferences">
            {interpolate(copy.preferenceSettings.current, { code: profile.personality.code })}
          </h2>

          {!editing ? (
            <button className="v3-primary-action" type="button" onClick={startEditing}>
              {copy.preferenceSettings.revisit}
            </button>
          ) : question && questionId ? (
            <form className="v3-preference-form" onSubmit={save}>
              <p className="v3-preference-form__progress">
                {interpolate(copy.preferences.questionOf, { current: questionIndex + 1 })}
              </p>
              <fieldset>
                <legend className="sr-only">{copy.preferences.groupLabel}</legend>
                <h3 ref={questionHeadingRef} tabIndex={-1}>{question.question}</h3>
                <div className="v3-preference-form__options">
                  {question.options.map((option) => {
                    const selected = selectedValue === option.value;
                    return (
                      <button
                        className={selected ? "is-selected" : undefined}
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setAnswers((current) => current
                            ? withPreferenceValue(current, questionId, option.value)
                            : current);
                          setNotice("");
                        }}
                      >
                        <span aria-hidden="true">{option.value}</span>
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="v3-preference-form__preview" aria-live="polite">
                <p className="v3-eyebrow">{copy.preferences.resultEyebrow}</p>
                <strong>{interpolate(copy.preferences.closestTo, { code: preview.code })}</strong>
                <p>{copy.preferences.resultNote}</p>
              </div>

              {notice && <p className="v3-field-error" role="alert">{notice}</p>}
              <div className="v3-actions">
                <button className="v3-text-action" type="button" onClick={cancelEditing}>
                  {copy.common.cancel}
                </button>
                {questionIndex > 0 && (
                  <button className="v3-text-action" type="button" onClick={() => setQuestionIndex((current) => current - 1)}>
                    {copy.common.back}
                  </button>
                )}
                {questionIndex < V3_PREFERENCE_QUESTION_IDS.length - 1 ? (
                  <button className="v3-primary-action" type="button" onClick={advance}>
                    {copy.common.continue}
                  </button>
                ) : (
                  <button className="v3-primary-action" type="submit">
                    {copy.preferenceSettings.save}
                  </button>
                )}
              </div>
            </form>
          ) : null}

          {!editing && notice && <p className="v3-status" role="status">{notice}</p>}
        </section>
      </article>
    </V3Shell>
  );
}

function answersFromState(answers: PreferenceAnswersV3): PreferenceAnswersV3 {
  return {
    eOrI: answers.eOrI,
    sOrN: answers.sOrN,
    tOrF: answers.tOrF,
    jOrP: answers.jOrP,
  };
}

function preferenceValue(
  answers: PreferenceAnswersV3,
  questionId: V3PreferenceQuestionId,
): V3PersonalityDimensionId {
  if (questionId === "ei") return answers.eOrI;
  if (questionId === "sn") return answers.sOrN;
  if (questionId === "tf") return answers.tOrF;
  return answers.jOrP;
}

function withPreferenceValue(
  answers: PreferenceAnswersV3,
  questionId: V3PreferenceQuestionId,
  value: V3PersonalityDimensionId,
): PreferenceAnswersV3 {
  if (questionId === "ei" && (value === "E" || value === "I")) return { ...answers, eOrI: value };
  if (questionId === "sn" && (value === "S" || value === "N")) return { ...answers, sOrN: value };
  if (questionId === "tf" && (value === "T" || value === "F")) return { ...answers, tOrF: value };
  if (questionId === "jp" && (value === "J" || value === "P")) return { ...answers, jOrP: value };
  return answers;
}
