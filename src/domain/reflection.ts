import { createSeededPrng } from "./prng";
import { getSymbolSelection, type SymbolSelection } from "./symbols";
import type {
  DailyCheckIn,
  Focus,
  PatternConfiguration,
  Profile,
  RecentSummary,
  ReflectionOutput,
} from "./types";

export const LOCAL_REFLECTION_VERSION = "ninefold-local-reflection-v1";
export const REFLECTION_DISCLAIMER =
  "Ninefold is a creative reflection experience, not a diagnostic, counselling or fortune-telling service.";

export interface ReflectionInput {
  profile: Profile;
  checkIn: DailyCheckIn;
  configuration: PatternConfiguration;
  symbols: SymbolSelection;
  recentSummaries: readonly RecentSummary[];
}

export interface ReflectionProvider {
  readonly id: string;
  readonly label: string;
  reflect(input: ReflectionInput): ReflectionOutput;
}

const ACTIONS: Readonly<Record<Focus, readonly string[]>> = {
  work: [
    "Choose one unfinished task and define the smallest visible next step.",
    "Block twenty focused minutes for the decision that is holding up other work.",
    "Write a three-line definition of done for one priority before continuing.",
    "Remove one low-value task from today's list and finish one useful unit of work.",
  ],
  study: [
    "Spend twenty minutes resolving one uncertainty before adding new material.",
    "Explain one difficult idea in five plain sentences, then mark the gap that remains.",
    "Choose one concept to retrieve from memory before reviewing your notes.",
    "Make one small comparison table for ideas that currently blur together.",
  ],
  relationships: [
    "Ask one direct question instead of interpreting silence.",
    "Name one need plainly and leave room for the other person's answer.",
    "Send one specific message of appreciation without asking for anything in return.",
    "Clarify one assumption in a calm conversation before acting on it.",
  ],
  creativity: [
    "Create one rough version before evaluating its quality.",
    "Set a fifteen-minute constraint and make one imperfect variation.",
    "Choose one element to exaggerate, then notice what the change reveals.",
    "Finish a small fragment that can stand on its own today.",
  ],
  self: [
    "Remove one unnecessary demand from today's plan.",
    "Choose one ten-minute reset and give it a definite start time.",
    "Write down one boundary that would make today more sustainable.",
    "Complete one small act of care before adding another obligation.",
  ],
};

const QUESTIONS: Readonly<Record<Focus, readonly string[]>> = {
  work: [
    "Which outcome needs a clear next step more than it needs more thought?",
    "What would make today's effort visible and complete enough?",
    "Where could a useful boundary protect your attention?",
  ],
  study: [
    "Which uncertainty would unlock the most understanding if examined first?",
    "What can you explain without looking, and where does the explanation become vague?",
    "Would depth or range serve this study session better?",
  ],
  relationships: [
    "What could be asked directly rather than inferred?",
    "Where can warmth and a clear boundary coexist today?",
    "What are you ready to hear without immediately solving?",
  ],
  creativity: [
    "What could you make before deciding whether it is good?",
    "Which constraint might give the idea a more distinct shape?",
    "What wants a rough form rather than another round of evaluation?",
  ],
  self: [
    "What would make today's pace more sustainable without abandoning what matters?",
    "Which demand is real, and which one have you added yourself?",
    "What is one kind, concrete choice available within your current energy?",
  ],
};

const trimPeriod = (value: string): string => value.replace(/[.]$/, "");

function checkInTension(checkIn: DailyCheckIn): string {
  if (checkIn.energy <= 2 && checkIn.clarity >= 4) {
    return "The direction may be clear while the energy available to carry it is limited.";
  }
  if (checkIn.energy >= 4 && checkIn.clarity <= 2) {
    return "Available energy may move faster than the question is becoming clear.";
  }
  if (checkIn.connection === "inward") {
    return "Inward attention can support discernment, but it may also delay useful contact.";
  }
  if (checkIn.connection === "outward") {
    return "Outward attention can create movement, though quick responses may outrun reflection.";
  }
  return "Holding several needs in balance can become a reason to postpone a workable choice.";
}

function lensPhrase(profile: Profile): string | null {
  const lenses = profile.lenses;
  if (lenses?.orientation === "internal") return "An inward wording lens favours a private pause before expression.";
  if (lenses?.orientation === "external") return "An outward wording lens favours making the next step observable.";
  if (lenses?.approach === "structured") return "A defined boundary may help that opportunity hold its shape.";
  if (lenses?.approach === "exploratory") return "A small experiment may reveal more than a fixed plan.";
  if (lenses?.processing === "analytical") return "Separating evidence from interpretation may make the next move clearer.";
  if (lenses?.processing === "intuitive") return "A first impression can be noted, then checked against what is observable.";
  if (lenses?.pace === "stable") return "A repeatable step is likely to be more useful than a dramatic change.";
  if (lenses?.pace === "adaptive") return "Leave one part of the plan adjustable as new information appears.";
  if (["aries", "leo", "sagittarius"].includes(profile.zodiacSign ?? "")) {
    return "The optional zodiac lens keeps this phrasing direct and action-oriented, without making a prediction.";
  }
  if (["taurus", "virgo", "capricorn"].includes(profile.zodiacSign ?? "")) {
    return "The optional zodiac lens keeps this phrasing grounded in a practical next step.";
  }
  if (["gemini", "libra", "aquarius"].includes(profile.zodiacSign ?? "")) {
    return "The optional zodiac lens keeps this phrasing open to comparison and dialogue.";
  }
  if (["cancer", "scorpio", "pisces"].includes(profile.zodiacSign ?? "")) {
    return "The optional zodiac lens keeps this phrasing reflective while staying with observable input.";
  }
  return null;
}

function recentPattern(input: ReflectionInput): string | null {
  if (input.recentSummaries.length === 0) return null;
  const sameForm = input.recentSummaries.filter(
    (summary) => summary.form === input.configuration.form,
  ).length;
  if (sameForm >= 2) {
    return `The ${input.configuration.form} has repeated recently, making its ${trimPeriod(input.symbols.form.meaning).toLowerCase()} worth noticing.`;
  }
  const sameDirection = input.recentSummaries.filter(
    (summary) => summary.direction === input.configuration.direction,
  ).length;
  if (sameDirection >= 2) {
    return `The repeated ${input.configuration.direction} direction suggests this mode of attention has been persistent across recent entries.`;
  }
  return null;
}

export class LocalReflectionProvider implements ReflectionProvider {
  readonly id = LOCAL_REFLECTION_VERSION;
  readonly label = "Local symbolic engine";

  reflect(input: ReflectionInput): ReflectionOutput {
    const { profile, checkIn, configuration, symbols } = input;
    const random = createSeededPrng(`${configuration.seed}|${LOCAL_REFLECTION_VERSION}`);
    const focusLabel = checkIn.focus === "relationships" ? "relationships" : checkIn.focus;
    const pathContext = `Path ${profile.pathNumber} (${symbols.path.name})`;
    const recent = recentPattern(input);
    const lens = lensPhrase(profile);
    const opportunityTail = recent ?? lens ?? symbols.form.suggestedActionTendency;

    const themes = [
      `${symbols.dailyNumber.name} through ${symbols.primaryColor.name.toLowerCase()} ${configuration.form}`,
      `${symbols.form.name[0]?.toUpperCase()}${symbols.form.name.slice(1)} in ${configuration.direction} motion`,
      `${symbols.primaryColor.name} ${symbols.dailyNumber.name.toLowerCase()}`,
    ];

    return {
      theme: random.pick(themes),
      evidence: [
        `Energy ${checkIn.energy}/5 and clarity ${checkIn.clarity}/5 place today's ${focusLabel} focus in a ${checkIn.connection} mode.`,
        `${pathContext} meets daily number ${configuration.dailyNumber} (${symbols.dailyNumber.name}), with ${symbols.primaryColor.name}, a ${configuration.form} and ${configuration.direction} direction.`,
      ],
      tension: `${checkInTension(checkIn)} ${symbols.primaryColor.possibleTension}`,
      opportunity: `${symbols.dailyNumber.dailyExpression} ${trimPeriod(symbols.direction.meaning)}; ${opportunityTail[0]?.toLowerCase()}${opportunityTail.slice(1)}`,
      action: random.pick(ACTIONS[checkIn.focus]),
      reflectionQuestion: random.pick(QUESTIONS[checkIn.focus]),
      disclaimer: REFLECTION_DISCLAIMER,
    };
  }
}

export const localReflectionProvider = new LocalReflectionProvider();

export function buildReflectionInput(
  profile: Profile,
  checkIn: DailyCheckIn,
  configuration: PatternConfiguration,
  recentSummaries: readonly RecentSummary[] = [],
): ReflectionInput {
  return {
    profile,
    checkIn,
    configuration,
    symbols: getSymbolSelection(configuration),
    recentSummaries: recentSummaries.slice(-7),
  };
}

export function createLocalReflection(
  profile: Profile,
  checkIn: DailyCheckIn,
  configuration: PatternConfiguration,
  recentSummaries: readonly RecentSummary[] = [],
): ReflectionOutput {
  return localReflectionProvider.reflect(
    buildReflectionInput(profile, checkIn, configuration, recentSummaries),
  );
}

export function isReflectionOutput(value: unknown): value is ReflectionOutput {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.theme === "string" &&
    Array.isArray(record.evidence) &&
    record.evidence.length === 2 &&
    record.evidence.every((item) => typeof item === "string") &&
    typeof record.tension === "string" &&
    typeof record.opportunity === "string" &&
    typeof record.action === "string" &&
    typeof record.reflectionQuestion === "string" &&
    typeof record.disclaimer === "string"
  );
}
