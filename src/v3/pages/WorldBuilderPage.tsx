import { useEffect, useMemo, useRef, useState } from "react";
import type { PathNumber } from "../../domain";
import { localizedPath } from "../../i18n";
import { useNavigate } from "react-router-dom";
import {
  derivePersonalityPreferences,
  deriveZodiacSign,
  isPreferenceAnswers,
  isValidBirthDate,
  type AmbientMode,
  type CloudArchetype,
  type DraftWorldIdentity,
  type PreferenceAnswersV3,
} from "../domain";
import {
  V3_PREFERENCE_QUESTION_IDS,
  type V3CloudArchetypeId,
  type V3PreferenceQuestionId,
} from "../copy";
import { useV3App } from "../V3App";
import { BreathingSession, type BreathingLabels } from "../components/BreathingSession";
import { V3Shell } from "../components/V3Shell";
import { WorldPrototypePicker } from "../components/WorldPrototypePicker";
import { WorldScene, type WorldSceneStage } from "../components/WorldScene";

const CLOUD_TO_SCENE: Readonly<Record<CloudArchetype, "high" | "layered" | "soft" | "flowing">> = {
  "high-veils": "high",
  "layered-horizon": "layered",
  "soft-cumulus": "soft",
  "wind-drawn": "flowing",
};

const COPY_TO_CLOUD: Readonly<Record<V3CloudArchetypeId, CloudArchetype>> = {
  thin: "high-veils",
  layered: "layered-horizon",
  soft: "soft-cumulus",
  flowing: "wind-drawn",
};

const CLOUD_TO_COPY: Readonly<Record<CloudArchetype, V3CloudArchetypeId>> = {
  "high-veils": "thin",
  "layered-horizon": "layered",
  "soft-cumulus": "soft",
  "wind-drawn": "flowing",
};

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

export function WorldBuilderPage() {
  const { copy, draft, locale, updateDraft, completeBuilder } = useV3App();
  const navigate = useNavigate();
  const stageHeadingRef = useRef<HTMLHeadingElement>(null);
  const [month, setMonth] = useState<number | "">(draft.birthMonth ?? "");
  const [day, setDay] = useState<number | "">(draft.birthDay ?? "");
  const [error, setError] = useState("");
  const [cloudPreview, setCloudPreview] = useState<CloudArchetype | null>(null);
  const [worldPreview, setWorldPreview] = useState<PathNumber | null>(null);
  const [birthProgress, setBirthProgress] = useState(draft.bareTreeBorn ? 1 : 0);
  const [preferenceIndex, setPreferenceIndex] = useState(() => firstIncompletePreference(draft));

  useEffect(() => {
    stageHeadingRef.current?.focus();
    setError("");
  }, [draft.stage]);

  const chosenCloud = cloudPreview ?? draft.cloudArchetype ?? null;
  const chosenPath = worldPreview ?? draft.worldPrototype ?? null;
  const sceneStage = resolveSceneStage(draft, birthProgress);
  const zodiac = draft.zodiacSign ?? null;
  const sceneDescription = buildSceneDescription(copy, draft, chosenCloud, chosenPath);

  const saveBirthDate = () => {
    if (month === "" || day === "") {
      setError(copy.errors.incompleteDate);
      return;
    }
    if (!isValidBirthDate(month, day)) {
      setError(copy.errors.invalidDate);
      return;
    }
    const zodiacSign = deriveZodiacSign(month, day);
    updateDraft({ birthMonth: month, birthDay: day, zodiacSign, stage: "cloud" });
  };

  const saveCloud = () => {
    if (!draft.cloudArchetype) {
      setError(copy.errors.chooseCloud);
      return;
    }
    updateDraft({ stage: "world" });
  };

  const saveWorld = () => {
    if (!draft.worldPrototype) {
      setError(copy.errors.chooseWorld);
      return;
    }
    updateDraft({ stage: "first-breathing" });
  };

  const finishBirth = ({ ambientMode }: { ambientMode: AmbientMode }) => {
    setBirthProgress(1);
    updateDraft({ preferredAmbientMode: ambientMode, bareTreeBorn: true, stage: "nickname" });
  };

  const saveNickname = (nickname?: string) => {
    const trimmed = nickname?.trim();
    updateDraft({ nickname: trimmed || undefined, stage: "personality" });
  };

  const savePreference = (questionId: V3PreferenceQuestionId, value: string) => {
    const answers = { ...(draft.personalityAnswers ?? {}) };
    if (questionId === "ei" && (value === "E" || value === "I")) answers.eOrI = value;
    if (questionId === "sn" && (value === "S" || value === "N")) answers.sOrN = value;
    if (questionId === "tf" && (value === "T" || value === "F")) answers.tOrF = value;
    if (questionId === "jp" && (value === "J" || value === "P")) answers.jOrP = value;
    updateDraft({ personalityAnswers: answers });
  };

  const advancePreference = () => {
    const answers = draft.personalityAnswers;
    const questionId = V3_PREFERENCE_QUESTION_IDS[preferenceIndex];
    if (!questionId || !preferenceValue(answers, questionId)) {
      setError(copy.errors.choosePreference);
      return;
    }
    setError("");
    setPreferenceIndex((current) => Math.min(4, current + 1));
  };

  const enterWorld = () => {
    if (!isPreferenceAnswers(draft.personalityAnswers)) {
      setError(copy.errors.choosePreference);
      setPreferenceIndex(firstIncompletePreference(draft));
      return;
    }
    if (!completeBuilder(draft.personalityAnswers)) {
      setError(copy.errors.storageWrite);
      return;
    }
    navigate(localizedPath("/today", locale), { replace: true });
  };

  const worldOptions = useMemo(() => (
    Object.entries(copy.builder.worlds.options).map(([path, option]) => ({
      path: Number(path) as PathNumber,
      label: option.name,
      description: option.description,
    }))
  ), [copy]);

  return (
    <V3Shell builderMode>
      <section className="v3-builder" data-builder-stage={draft.stage}>
        <WorldScene
          className="v3-builder__world"
          stage={sceneStage}
          path={chosenPath}
          cloud={chosenCloud ? CLOUD_TO_SCENE[chosenCloud] : null}
          zodiac={zodiac}
          birthProgress={birthProgress}
          stableSeed={draft.stableSeed}
          title={copy.accessibility.worldScene}
          description={sceneDescription}
        />

        <div className="v3-builder__veil" aria-hidden="true" />
        <div className="v3-builder__panel">
          <p className="v3-builder__opening">{copy.builder.openingLine}</p>
          <h1 className="sr-only">{copy.builder.pageTitle}</h1>
          <div className="v3-builder__progress" aria-label={copy.builder.progressLabel}>
            <span style={{ transform: `scaleX(${builderProgress(draft.stage)})` }} />
          </div>

          {draft.stage === "birth-date" && (
            <section className="v3-builder-step" aria-labelledby="v3-builder-date-heading">
              <h2 id="v3-builder-date-heading" ref={stageHeadingRef} tabIndex={-1}>{copy.builder.birthDate.question}</h2>
              <p>{copy.builder.birthDate.supporting}</p>
              <div className="v3-date-fields">
                <label>
                  <span>{copy.builder.birthDate.monthLabel}</span>
                  <select value={month} onChange={(event) => setMonth(event.target.value ? Number(event.target.value) : "")}>
                    <option value="">{copy.builder.birthDate.monthPlaceholder}</option>
                    {MONTHS.map((value) => <option value={value} key={value}>{value}</option>)}
                  </select>
                </label>
                <label>
                  <span>{copy.builder.birthDate.dayLabel}</span>
                  <select value={day} onChange={(event) => setDay(event.target.value ? Number(event.target.value) : "")}>
                    <option value="">{copy.builder.birthDate.dayPlaceholder}</option>
                    {DAYS.map((value) => <option value={value} key={value}>{value}</option>)}
                  </select>
                </label>
              </div>
              <BuilderError message={error} />
              <button className="v3-primary-action" type="button" onClick={saveBirthDate}>{copy.builder.birthDate.confirm}</button>
            </section>
          )}

          {draft.stage === "cloud" && zodiac && (
            <section className="v3-builder-step" aria-labelledby="v3-builder-cloud-heading">
              <p className="v3-builder__discovery">{format(copy.builder.birthDate.discovered, {
                glyph: `${copy.builder.zodiac[zodiac].glyph}\uFE0E`,
                sign: copy.builder.zodiac[zodiac].name,
              })}</p>
              <h2 id="v3-builder-cloud-heading" ref={stageHeadingRef} tabIndex={-1}>{copy.builder.clouds.question}</h2>
              <p>{copy.builder.clouds.supporting}</p>
              <fieldset className="v3-cloud-picker">
                <legend className="sr-only">{copy.builder.clouds.groupLabel}</legend>
                {Object.entries(copy.builder.clouds.options).map(([id, option]) => {
                  const cloudId = id as V3CloudArchetypeId;
                  const value = COPY_TO_CLOUD[cloudId];
                  return (
                    <label
                      className={draft.cloudArchetype === value ? "is-selected" : undefined}
                      key={id}
                      onPointerEnter={() => setCloudPreview(value)}
                      onPointerLeave={() => setCloudPreview(null)}
                      onFocus={() => setCloudPreview(value)}
                      onBlur={() => setCloudPreview(null)}
                    >
                      <input
                        type="radio"
                        name="cloud-archetype"
                        value={value}
                        checked={draft.cloudArchetype === value}
                        onChange={() => updateDraft({ cloudArchetype: value })}
                      />
                      <strong>{option.name}</strong>
                      <span>{option.description}</span>
                    </label>
                  );
                })}
              </fieldset>
              <p className="sr-only" aria-live="polite">
                {draft.cloudArchetype
                  ? format(copy.builder.clouds.selectedAnnouncement, { cloud: copy.builder.clouds.options[CLOUD_TO_COPY[draft.cloudArchetype]].name })
                  : ""}
              </p>
              <BuilderError message={error} />
              <div className="v3-actions"><button className="v3-text-action" type="button" onClick={() => updateDraft({ stage: "birth-date" })}>{copy.common.back}</button><button className="v3-primary-action" type="button" onClick={saveCloud}>{copy.builder.clouds.continue}</button></div>
            </section>
          )}

          {draft.stage === "world" && (
            <section className="v3-builder-step v3-builder-step--wide" aria-labelledby="v3-builder-world-heading">
              <h2 id="v3-builder-world-heading" ref={stageHeadingRef} tabIndex={-1}>{copy.builder.worlds.question}</h2>
              <p>{copy.builder.worlds.supporting}</p>
              <WorldPrototypePicker
                legend={copy.builder.worlds.groupLabel}
                value={draft.worldPrototype ?? null}
                options={worldOptions}
                onChange={(worldPrototype) => updateDraft({ worldPrototype })}
                onPreview={setWorldPreview}
              />
              <p className="sr-only" aria-live="polite">
                {draft.worldPrototype
                  ? format(copy.builder.worlds.selectedAnnouncement, { world: copy.builder.worlds.options[draft.worldPrototype].name })
                  : ""}
              </p>
              <BuilderError message={error} />
              <div className="v3-actions"><button className="v3-text-action" type="button" onClick={() => updateDraft({ stage: "cloud" })}>{copy.common.back}</button><button className="v3-primary-action" type="button" onClick={saveWorld}>{copy.builder.worlds.confirm}</button></div>
            </section>
          )}

          {draft.stage === "first-breathing" && (
            <section className="v3-builder-step v3-builder-step--breathing" aria-labelledby="v3-builder-birth-heading">
              <h2 className="sr-only" id="v3-builder-birth-heading" ref={stageHeadingRef} tabIndex={-1}>{copy.builder.firstBreathing.title}</h2>
              <p className="v3-seed-note"><strong>{copy.builder.seed.title}</strong> {copy.builder.seed.body}</p>
              <BreathingSession
                kind="birth"
                labels={birthLabels(copy)}
                defaultMode={draft.preferredAmbientMode}
                onModeChange={(preferredAmbientMode) => updateDraft({ preferredAmbientMode })}
                onProgress={setBirthProgress}
                onComplete={finishBirth}
              />
            </section>
          )}

          {draft.stage === "nickname" && (
            <NicknameStep
              draft={draft}
              copy={copy}
              headingRef={stageHeadingRef}
              onContinue={saveNickname}
            />
          )}

          {draft.stage === "personality" && (
            <PreferenceStep
              copy={copy}
              draft={draft}
              index={preferenceIndex}
              error={error}
              headingRef={stageHeadingRef}
              onChoose={savePreference}
              onBack={() => setPreferenceIndex((current) => Math.max(0, current - 1))}
              onNext={advancePreference}
              onComplete={enterWorld}
            />
          )}
        </div>
      </section>
    </V3Shell>
  );
}

function NicknameStep({
  draft,
  copy,
  headingRef,
  onContinue,
}: {
  draft: DraftWorldIdentity;
  copy: ReturnType<typeof useV3App>["copy"];
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onContinue: (nickname?: string) => void;
}) {
  const [nickname, setNickname] = useState(draft.nickname ?? "");
  return (
    <section className="v3-builder-step" aria-labelledby="v3-builder-nickname-heading">
      <p className="v3-eyebrow">{copy.nickname.eyebrow}</p>
      <h2 id="v3-builder-nickname-heading" ref={headingRef} tabIndex={-1}>{copy.nickname.question}</h2>
      <p>{copy.nickname.supporting}</p>
      <label className="v3-field">
        <span>{copy.nickname.label} <small>{copy.common.optional}</small></span>
        <input
          type="text"
          value={nickname}
          maxLength={40}
          autoComplete="nickname"
          placeholder={copy.nickname.placeholder}
          onChange={(event) => setNickname(event.target.value)}
        />
      </label>
      <p className="v3-field-note">{format(copy.nickname.characterCount, { count: nickname.length, limit: 40 })} · {copy.nickname.localOnly}</p>
      <div className="v3-actions">
        <button className="v3-primary-action" type="button" onClick={() => onContinue(nickname)}>{copy.nickname.continue}</button>
        <button className="v3-text-action" type="button" onClick={() => onContinue()}>{copy.nickname.skip}</button>
      </div>
    </section>
  );
}

function PreferenceStep({
  copy,
  draft,
  index,
  error,
  headingRef,
  onChoose,
  onBack,
  onNext,
  onComplete,
}: {
  copy: ReturnType<typeof useV3App>["copy"];
  draft: DraftWorldIdentity;
  index: number;
  error: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onChoose: (questionId: V3PreferenceQuestionId, value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
}) {
  if (index >= V3_PREFERENCE_QUESTION_IDS.length && isPreferenceAnswers(draft.personalityAnswers)) {
    const result = derivePersonalityPreferences(draft.personalityAnswers);
    return (
      <section className="v3-builder-step" aria-labelledby="v3-builder-result-heading">
        <p className="v3-eyebrow">{copy.preferences.resultEyebrow}</p>
        <h2 id="v3-builder-result-heading" ref={headingRef} tabIndex={-1}>
          {format(copy.preferences.closestTo, { code: result.code })}
        </h2>
        <p>{copy.preferences.resultNote}</p>
        <BuilderError message={error} />
        <button className="v3-primary-action" type="button" onClick={onComplete}>{copy.preferences.continue}</button>
      </section>
    );
  }

  const questionId = V3_PREFERENCE_QUESTION_IDS[index] ?? "ei";
  const question = copy.preferences.questions[questionId];
  const selected = preferenceValue(draft.personalityAnswers, questionId);
  return (
    <section className="v3-builder-step" aria-labelledby="v3-builder-preference-heading">
      <p className="v3-eyebrow">{copy.preferences.eyebrow}</p>
      <p>{format(copy.preferences.questionOf, { current: index + 1 })}</p>
      <h2 id="v3-builder-preference-heading" ref={headingRef} tabIndex={-1}>{question.question}</h2>
      <fieldset className="v3-preference-question" aria-labelledby="v3-builder-preference-heading">
        <legend className="sr-only">{copy.preferences.groupLabel}</legend>
        <div className="v3-preference-question__options">
          {question.options.map((option) => (
            <label className={selected === option.value ? "is-selected" : undefined} key={option.value}>
              <input
                type="radio"
                name={`builder-preference-${questionId}`}
                value={option.value}
                checked={selected === option.value}
                onChange={() => onChoose(questionId, option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <BuilderError message={error} />
      <div className="v3-actions">
        {index > 0 && <button className="v3-text-action" type="button" onClick={onBack}>{copy.common.back}</button>}
        <button className="v3-primary-action" type="button" onClick={onNext}>{copy.common.continue}</button>
      </div>
    </section>
  );
}

function BuilderError({ message }: { message: string }) {
  return <p className="v3-form-error" role="alert">{message}</p>;
}

function preferenceValue(
  answers: Partial<PreferenceAnswersV3> | undefined,
  questionId: V3PreferenceQuestionId,
): string | undefined {
  if (questionId === "ei") return answers?.eOrI;
  if (questionId === "sn") return answers?.sOrN;
  if (questionId === "tf") return answers?.tOrF;
  return answers?.jOrP;
}

function firstIncompletePreference(draft: DraftWorldIdentity): number {
  return V3_PREFERENCE_QUESTION_IDS.findIndex((question) => !preferenceValue(draft.personalityAnswers, question)) >= 0
    ? V3_PREFERENCE_QUESTION_IDS.findIndex((question) => !preferenceValue(draft.personalityAnswers, question))
    : V3_PREFERENCE_QUESTION_IDS.length;
}

function resolveSceneStage(draft: DraftWorldIdentity, birthProgress: number): WorldSceneStage {
  if (draft.stage === "birth-date") return draft.zodiacSign ? "zodiac" : "sky";
  if (draft.stage === "cloud") return "cloud";
  if (draft.stage === "world") return "prototype";
  if (draft.stage === "first-breathing") return birthProgress > 0 ? "birth" : "seed";
  return "bare";
}

function builderProgress(stage: DraftWorldIdentity["stage"]): number {
  const order: DraftWorldIdentity["stage"][] = ["birth-date", "cloud", "world", "first-breathing", "nickname", "personality"];
  return (order.indexOf(stage) + 1) / order.length;
}

function buildSceneDescription(
  copy: ReturnType<typeof useV3App>["copy"],
  draft: DraftWorldIdentity,
  cloud: CloudArchetype | null,
  path: PathNumber | null,
): string {
  if (draft.stage === "birth-date" && !draft.zodiacSign) return copy.accessibility.emptySky;
  if (draft.stage === "cloud" && cloud) {
    return format(copy.accessibility.cloudPreview, {
      cloud: copy.builder.clouds.options[CLOUD_TO_COPY[cloud]].name,
    });
  }
  if (draft.stage === "cloud" && draft.zodiacSign) {
    return format(copy.accessibility.zodiacMotif, {
      sign: copy.builder.zodiac[draft.zodiacSign].name,
    });
  }
  if (draft.stage === "world" && path) {
    const world = copy.builder.worlds.options[path];
    return format(copy.accessibility.worldPreview, {
      world: world.name,
      description: world.description,
    });
  }
  if (draft.stage === "world") return copy.builder.worlds.supporting;
  if (draft.stage === "first-breathing") return copy.accessibility.seed;
  return copy.accessibility.bareTree;
}

function birthLabels(copy: ReturnType<typeof useV3App>["copy"]): BreathingLabels {
  return {
    eyebrow: copy.builder.firstBreathing.eyebrow,
    title: copy.builder.firstBreathing.title,
    subtitle: copy.builder.firstBreathing.body,
    durationLegend: copy.session.durationLabel,
    oneMinute: copy.session.oneMinute,
    fiveMinutes: copy.session.fiveMinutes,
    soundLegend: copy.builder.firstBreathing.soundQuestion,
    ocean: copy.builder.firstBreathing.ocean,
    rain: copy.builder.firstBreathing.rain,
    begin: copy.builder.firstBreathing.begin,
    skip: copy.builder.firstBreathing.skip,
    exit: copy.session.exit,
    mute: copy.session.mute,
    unmute: copy.session.unmute,
    volume: copy.session.volume,
    progress: (remaining) => format(copy.builder.firstBreathing.timeRemaining, { seconds: remaining }),
  };
}

function format(template: string, values: Readonly<Record<string, string | number>>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
