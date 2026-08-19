import type {
  AdviceId,
  DailyCheckInV3,
  EaseOffId,
  FavourId,
  KeywordId,
  V3Profile,
} from "../domain";
import type {
  V3AdviceId,
  V3Copy,
  V3EaseOffId,
  V3FavourId,
  V3KeywordId,
  V3PersonalityDimensionId,
} from "../copy";

interface DailyReadingProps {
  profile: V3Profile;
  checkIn: DailyCheckInV3;
  copy: V3Copy;
}

const keywordMap: Readonly<Record<KeywordId, V3KeywordId>> = {
  grounding: "grounding",
  gentleness: "gentleness",
  clarity: "clarity",
  balance: "balance",
  connection: "connection",
  focus: "focus",
  openness: "openness",
  momentum: "momentum",
  renewal: "pause",
};

const favourMap: Readonly<Record<FavourId, V3FavourId>> = {
  "one-small-task": "one-small-thing",
  "quiet-time": "quiet-time",
  "gentle-movement": "slow-walk",
  "clear-space": "tidy-a-corner",
  "warm-conversation": "gentle-company",
  "single-priority": "finish-one-thing",
  "slow-start": "simple-rhythm",
  "make-notes": "write-it-down",
  "finish-open-loop": "finish-one-thing",
  "fresh-air": "slow-walk",
  "protect-time": "leave-margin",
  "ask-for-help": "ask-for-help",
  "simple-routine": "simple-rhythm",
  "creative-play": "make-something",
  "listen-first": "gentle-company",
  "rest-between-tasks": "leave-margin",
  "name-a-boundary": "leave-margin",
  "share-a-thought": "gentle-company",
};

const easeOffMap: Readonly<Record<EaseOffId, V3EaseOffId>> = {
  "too-many-starts": "too-many-starts",
  "extra-commitments": "new-commitments",
  "forced-answers": "forced-answers",
  "constant-switching": "too-many-starts",
  "self-criticism": "perfection",
  "rushed-decisions": "rushing",
  overexplaining: "overexplaining",
  "crowded-schedule": "late-plans",
  comparison: "comparison",
  "all-or-nothing": "perfection",
};

export function DailyReading({ profile, checkIn, copy }: DailyReadingProps) {
  const reading = checkIn.semanticReading;
  const zodiac = copy.builder.zodiac[profile.zodiacSign];
  const letters = profile.personality.code.split("") as V3PersonalityDimensionId[];
  const adviceId = resolveAdviceId(reading.adviceId);
  const state = copy.semantics.states[reading.stateCell];

  return (
    <section className="v3-reading" aria-labelledby="v3-reading-title">
      <h2 className="sr-only" id="v3-reading-title">{copy.reading.pageTitle}</h2>

      <article className="v3-reading__baseline">
        <p className="v3-eyebrow">{copy.reading.baselineHeading}</p>
        <h3>{profile.personality.code} · {zodiac.glyph}{"\uFE0E"} {zodiac.name}</h3>
        <p>{letters.slice(0, 2).map((letter) => copy.semantics.personalityDimensions[letter]).join(" ")}</p>
      </article>

      <article className="v3-reading__state">
        <p className="v3-eyebrow">{copy.reading.stateHeading}</p>
        <p>{state.summary}</p>
      </article>

      <article className="v3-reading__fortune">
        <p className="v3-eyebrow">{copy.reading.symbolicHeading}</p>
        <h3>{copy.reading.keyword} · {copy.semantics.keywords[keywordMap[reading.keywordId]]}</h3>
        <dl>
          <div>
            <dt>{copy.reading.favour}</dt>
            <dd>{reading.favourIds.map((id) => copy.semantics.favour[favourMap[id]]).join(" · ")}</dd>
          </div>
          <div>
            <dt>{copy.reading.easeOff}</dt>
            <dd>{reading.easeOffIds.map((id) => copy.semantics.easeOff[easeOffMap[id]]).join(" · ")}</dd>
          </div>
        </dl>
        <small>{copy.reading.symbolicNote}</small>
      </article>

      <article className="v3-reading__advice">
        <p className="v3-eyebrow">{copy.reading.suitedHeading}</p>
        <p>{copy.semantics.advice[adviceId]}</p>
      </article>
    </section>
  );
}

function resolveAdviceId(adviceId: AdviceId): V3AdviceId {
  const letter = adviceId.charAt(0);
  if (letter === "i" || letter === "e") return `${letter}-low-energy`;
  if (letter === "s" || letter === "n") return `${letter}-low-mood`;
  if (letter === "t" || letter === "f") return `${letter}-overloaded`;
  if (letter === "j") return "j-uncertain";
  if (letter === "p") return "p-scattered";
  return "balanced-momentum";
}
