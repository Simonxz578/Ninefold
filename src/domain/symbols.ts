import type {
  ColorName,
  GeometricForm,
  PathNumber,
  PatternConfiguration,
  VisualDirection,
} from "./types";

export const SYMBOL_DICTIONARY_VERSION = "ninefold-symbols-v1";

export interface ScoreInfluence {
  clarity: -1 | 0 | 1;
  momentum: -1 | 0 | 1;
  tension: -1 | 0 | 1;
}

export interface SymbolMeaning {
  meaning: string;
  constructiveExpression: string;
  possibleTension: string;
  suggestedActionTendency: string;
  scoreInfluence: ScoreInfluence;
}

export interface NumberSymbol extends SymbolMeaning {
  number: PathNumber;
  name: string;
  keywords: readonly [string, string, string];
  dailyExpression: string;
}

export interface ColorSymbol extends SymbolMeaning {
  name: ColorName;
  hex: `#${string}`;
}

export interface FormSymbol extends SymbolMeaning {
  name: GeometricForm;
}

export interface DirectionSymbol {
  name: VisualDirection;
  meaning: string;
  scoreInfluence: ScoreInfluence;
}

export const NUMBER_SYMBOLS: Readonly<Record<PathNumber, NumberSymbol>> = {
  1: {
    number: 1,
    name: "Initiation",
    keywords: ["agency", "beginning", "direction"],
    meaning: "Agency, beginning and direction.",
    constructiveExpression: "Starting, choosing and acting independently.",
    possibleTension: "Impatience, isolation or forcing direction.",
    suggestedActionTendency: "Choose one clear beginning and make it visible.",
    dailyExpression: "A day for identifying the first useful move.",
    scoreInfluence: { clarity: 0, momentum: 1, tension: 0 },
  },
  2: {
    number: 2,
    name: "Connection",
    keywords: ["balance", "sensitivity", "partnership"],
    meaning: "Balance, sensitivity and partnership.",
    constructiveExpression: "Listening, cooperating and noticing relationships.",
    possibleTension: "Indecision, over-accommodation or dependence.",
    suggestedActionTendency: "Listen for what changes when two perspectives meet.",
    dailyExpression: "A day for noticing the relationship between two needs.",
    scoreInfluence: { clarity: 0, momentum: -1, tension: 0 },
  },
  3: {
    number: 3,
    name: "Expression",
    keywords: ["curiosity", "communication", "expansion"],
    meaning: "Curiosity, communication and expansion.",
    constructiveExpression: "Sharing, creating and exploring possibilities.",
    possibleTension: "Distraction, overstimulation or unfinished ideas.",
    suggestedActionTendency: "Give one developing idea a concrete form.",
    dailyExpression: "A day for translating an idea into something shareable.",
    scoreInfluence: { clarity: 0, momentum: 1, tension: 0 },
  },
  4: {
    number: 4,
    name: "Structure",
    keywords: ["stability", "method", "boundaries"],
    meaning: "Stability, method and boundaries.",
    constructiveExpression: "Planning, organising and sustaining effort.",
    possibleTension: "Rigidity, over-control or resistance to change.",
    suggestedActionTendency: "Create a boundary or sequence that supports progress.",
    dailyExpression: "A day for giving one priority a workable structure.",
    scoreInfluence: { clarity: 1, momentum: 0, tension: 0 },
  },
  5: {
    number: 5,
    name: "Movement",
    keywords: ["change", "experimentation", "freedom"],
    meaning: "Change, experimentation and freedom.",
    constructiveExpression: "Adapting, testing and moving beyond routine.",
    possibleTension: "Restlessness, inconsistency or avoidance of commitment.",
    suggestedActionTendency: "Run one bounded experiment instead of changing everything.",
    dailyExpression: "A day for testing a small departure from routine.",
    scoreInfluence: { clarity: -1, momentum: 1, tension: 1 },
  },
  6: {
    number: 6,
    name: "Care",
    keywords: ["responsibility", "relationship", "harmony"],
    meaning: "Responsibility, relationship and harmony.",
    constructiveExpression: "Supporting, restoring and building trust.",
    possibleTension: "Over-responsibility, perfectionism or self-neglect.",
    suggestedActionTendency: "Support what matters without carrying all of it.",
    dailyExpression: "A day for making care practical and appropriately bounded.",
    scoreInfluence: { clarity: 0, momentum: 0, tension: 1 },
  },
  7: {
    number: 7,
    name: "Reflection",
    keywords: ["depth", "distance", "interpretation"],
    meaning: "Depth, distance and interpretation.",
    constructiveExpression: "Observing, analysing and finding meaning.",
    possibleTension: "Withdrawal, overthinking or emotional distance.",
    suggestedActionTendency: "Pause long enough to distinguish evidence from assumption.",
    dailyExpression: "A day for examining one question before acting on it.",
    scoreInfluence: { clarity: 1, momentum: -1, tension: 0 },
  },
  8: {
    number: 8,
    name: "Realisation",
    keywords: ["power", "execution", "consequence"],
    meaning: "Power, execution and material consequence.",
    constructiveExpression: "Deciding, delivering and using influence responsibly.",
    possibleTension: "Pressure, dominance or measuring everything through outcomes.",
    suggestedActionTendency: "Make one consequential decision with its impact in view.",
    dailyExpression: "A day for connecting a decision to its practical consequence.",
    scoreInfluence: { clarity: 0, momentum: 1, tension: 1 },
  },
  9: {
    number: 9,
    name: "Integration",
    keywords: ["completion", "perspective", "renewal"],
    meaning: "Completion, perspective and renewal.",
    constructiveExpression: "Synthesising, releasing and understanding the wider pattern.",
    possibleTension: "Difficulty letting go, abstraction or emotional overload.",
    suggestedActionTendency: "Complete or release one thing to create useful space.",
    dailyExpression: "A day for deciding what can be completed, carried forward or released.",
    scoreInfluence: { clarity: 1, momentum: 0, tension: 0 },
  },
};

export const COLOR_SYMBOLS: Readonly<Record<ColorName, ColorSymbol>> = {
  Indigo: {
    name: "Indigo",
    hex: "#5967C9",
    meaning: "Discernment and inward depth.",
    constructiveExpression: "Quiet concentration and careful interpretation.",
    possibleTension: "Retreating too far into thought.",
    suggestedActionTendency: "Protect a short period for undivided attention.",
    scoreInfluence: { clarity: 1, momentum: -1, tension: 0 },
  },
  Amber: {
    name: "Amber",
    hex: "#D99A3D",
    meaning: "Warmth and visible energy.",
    constructiveExpression: "Confidence, encouragement and practical optimism.",
    possibleTension: "Moving before enough is understood.",
    suggestedActionTendency: "Put available energy behind one useful step.",
    scoreInfluence: { clarity: 0, momentum: 1, tension: 0 },
  },
  Teal: {
    name: "Teal",
    hex: "#2F9B96",
    meaning: "Calibration and responsive balance.",
    constructiveExpression: "Adjusting with steadiness and listening for feedback.",
    possibleTension: "Endless adjustment without commitment.",
    suggestedActionTendency: "Make one adjustment, then observe its effect.",
    scoreInfluence: { clarity: 1, momentum: 0, tension: -1 },
  },
  Rose: {
    name: "Rose",
    hex: "#C77B91",
    meaning: "Openness and relational attention.",
    constructiveExpression: "Honesty, tenderness and receptive communication.",
    possibleTension: "Taking responsibility for another person's response.",
    suggestedActionTendency: "Say one true thing with warmth and clear boundaries.",
    scoreInfluence: { clarity: 0, momentum: 0, tension: -1 },
  },
  Moss: {
    name: "Moss",
    hex: "#71845B",
    meaning: "Patience and organic continuity.",
    constructiveExpression: "Sustainable progress and trust in gradual work.",
    possibleTension: "Staying with a familiar pattern past its usefulness.",
    suggestedActionTendency: "Continue the smallest practice that still feels alive.",
    scoreInfluence: { clarity: 0, momentum: 0, tension: -1 },
  },
  Cobalt: {
    name: "Cobalt",
    hex: "#3975D1",
    meaning: "Precision and direct expression.",
    constructiveExpression: "Clear decisions and articulate communication.",
    possibleTension: "Treating certainty as more important than nuance.",
    suggestedActionTendency: "Name the decision or question in one sentence.",
    scoreInfluence: { clarity: 1, momentum: 1, tension: 0 },
  },
  Violet: {
    name: "Violet",
    hex: "#8A68B8",
    meaning: "Imagination and reframing.",
    constructiveExpression: "Seeing alternatives and joining unlike ideas.",
    possibleTension: "Preferring possibility to a workable next step.",
    suggestedActionTendency: "Turn one imaginative option into a small prototype.",
    scoreInfluence: { clarity: 0, momentum: 0, tension: 0 },
  },
  Coral: {
    name: "Coral",
    hex: "#D87362",
    meaning: "Social vitality and candid movement.",
    constructiveExpression: "Engagement, generosity and lively exchange.",
    possibleTension: "Reacting quickly or scattering attention.",
    suggestedActionTendency: "Use conversation to move one shared matter forward.",
    scoreInfluence: { clarity: -1, momentum: 1, tension: 1 },
  },
  Slate: {
    name: "Slate",
    hex: "#667486",
    meaning: "Neutrality and measured observation.",
    constructiveExpression: "Composure, realism and useful distance.",
    possibleTension: "Flattening emotion or postponing engagement.",
    suggestedActionTendency: "Record what is known before interpreting it.",
    scoreInfluence: { clarity: 1, momentum: -1, tension: -1 },
  },
  Pearl: {
    name: "Pearl",
    hex: "#E5DDC8",
    meaning: "Space and quiet renewal.",
    constructiveExpression: "Simplicity, receptivity and a clean beginning.",
    possibleTension: "Avoiding complexity in pursuit of calm.",
    suggestedActionTendency: "Remove one nonessential element before adding more.",
    scoreInfluence: { clarity: 1, momentum: 0, tension: -1 },
  },
  Ochre: {
    name: "Ochre",
    hex: "#B7823D",
    meaning: "Grounded resourcefulness.",
    constructiveExpression: "Making practical use of what is already available.",
    possibleTension: "Choosing practicality without checking meaning.",
    suggestedActionTendency: "Use an existing resource to finish one concrete task.",
    scoreInfluence: { clarity: 0, momentum: 1, tension: -1 },
  },
  Crimson: {
    name: "Crimson",
    hex: "#A94850",
    meaning: "Conviction and concentrated force.",
    constructiveExpression: "Courage, commitment and decisive protection.",
    possibleTension: "Escalating pressure or narrowing too quickly.",
    suggestedActionTendency: "Direct intensity toward one bounded commitment.",
    scoreInfluence: { clarity: 0, momentum: 1, tension: 1 },
  },
};

export const FORM_SYMBOLS: Readonly<Record<GeometricForm, FormSymbol>> = {
  circle: {
    name: "circle",
    meaning: "Continuity and wholeness.",
    constructiveExpression: "Holding different parts within one frame.",
    possibleTension: "Repeating a loop without changing it.",
    suggestedActionTendency: "Notice what needs to be included before deciding.",
    scoreInfluence: { clarity: 0, momentum: 0, tension: -1 },
  },
  triangle: {
    name: "triangle",
    meaning: "Direction and productive tension.",
    constructiveExpression: "Focusing energy toward a distinct point.",
    possibleTension: "Making everything urgent or oppositional.",
    suggestedActionTendency: "Choose the point that deserves emphasis.",
    scoreInfluence: { clarity: 0, momentum: 1, tension: 1 },
  },
  square: {
    name: "square",
    meaning: "Foundation and containment.",
    constructiveExpression: "Creating stable conditions for sustained work.",
    possibleTension: "Protecting the structure after its purpose changes.",
    suggestedActionTendency: "Define the boundary that makes progress easier.",
    scoreInfluence: { clarity: 1, momentum: 0, tension: 0 },
  },
  pentagon: {
    name: "pentagon",
    meaning: "Coordination among several parts.",
    constructiveExpression: "Organising complexity without erasing difference.",
    possibleTension: "Trying to optimise every part at once.",
    suggestedActionTendency: "Identify which part currently carries the whole.",
    scoreInfluence: { clarity: 0, momentum: 0, tension: 1 },
  },
  hexagon: {
    name: "hexagon",
    meaning: "Interdependence and efficient structure.",
    constructiveExpression: "Joining individual contributions into a resilient system.",
    possibleTension: "Prioritising fit over fresh information.",
    suggestedActionTendency: "Strengthen one connection in the working system.",
    scoreInfluence: { clarity: 1, momentum: 0, tension: 0 },
  },
  diamond: {
    name: "diamond",
    meaning: "Discernment and sharpened value.",
    constructiveExpression: "Clarifying what matters through useful pressure.",
    possibleTension: "Becoming rigid around a single standard.",
    suggestedActionTendency: "State the criterion guiding today's choice.",
    scoreInfluence: { clarity: 1, momentum: 0, tension: 1 },
  },
  ring: {
    name: "ring",
    meaning: "Boundary, commitment and protected space.",
    constructiveExpression: "Maintaining focus through clear limits.",
    possibleTension: "Turning protection into exclusion.",
    suggestedActionTendency: "Protect one commitment and release one distraction.",
    scoreInfluence: { clarity: 1, momentum: 0, tension: 0 },
  },
  star: {
    name: "star",
    meaning: "Orientation and multiple lines of possibility.",
    constructiveExpression: "Keeping a guiding point while exploring options.",
    possibleTension: "Expanding possibilities faster than they can be tested.",
    suggestedActionTendency: "Use one guiding value to select among options.",
    scoreInfluence: { clarity: 0, momentum: 1, tension: 0 },
  },
  spiral: {
    name: "spiral",
    meaning: "Iteration and deepening movement.",
    constructiveExpression: "Returning with new information and refining over time.",
    possibleTension: "Mistaking repeated thought for development.",
    suggestedActionTendency: "Revisit one issue with a new question or constraint.",
    scoreInfluence: { clarity: -1, momentum: 1, tension: 0 },
  },
};

export const DIRECTION_SYMBOLS: Readonly<Record<VisualDirection, DirectionSymbol>> = {
  inward: {
    name: "inward",
    meaning: "Attention gathers toward the centre for examination.",
    scoreInfluence: { clarity: 1, momentum: -1, tension: 0 },
  },
  outward: {
    name: "outward",
    meaning: "Attention moves toward expression, contact and visible action.",
    scoreInfluence: { clarity: 0, momentum: 1, tension: 0 },
  },
  ascending: {
    name: "ascending",
    meaning: "Attention moves toward development and a higher-order view.",
    scoreInfluence: { clarity: 0, momentum: 1, tension: 0 },
  },
  descending: {
    name: "descending",
    meaning: "Attention returns to foundations, detail and grounded reality.",
    scoreInfluence: { clarity: 1, momentum: 0, tension: -1 },
  },
  balanced: {
    name: "balanced",
    meaning: "Attention holds opposing needs without forcing an early choice.",
    scoreInfluence: { clarity: 1, momentum: 0, tension: -1 },
  },
  rotating: {
    name: "rotating",
    meaning: "Attention changes vantage point through iteration.",
    scoreInfluence: { clarity: -1, momentum: 1, tension: 1 },
  },
};

export const SYMBOL_DICTIONARY = {
  version: SYMBOL_DICTIONARY_VERSION,
  numbers: NUMBER_SYMBOLS,
  colors: COLOR_SYMBOLS,
  forms: FORM_SYMBOLS,
  directions: DIRECTION_SYMBOLS,
} as const;

export interface SymbolSelection {
  path: NumberSymbol;
  dailyNumber: NumberSymbol;
  primaryColor: ColorSymbol;
  secondaryColor: ColorSymbol;
  form: FormSymbol;
  direction: DirectionSymbol;
}

export const getNumberSymbol = (number: PathNumber): NumberSymbol => NUMBER_SYMBOLS[number];
export const getColorSymbol = (name: ColorName): ColorSymbol => COLOR_SYMBOLS[name];
export const getFormSymbol = (name: GeometricForm): FormSymbol => FORM_SYMBOLS[name];
export const getDirectionSymbol = (name: VisualDirection): DirectionSymbol =>
  DIRECTION_SYMBOLS[name];

export function getSymbolSelection(configuration: PatternConfiguration): SymbolSelection {
  return {
    path: getNumberSymbol(configuration.pathNumber),
    dailyNumber: getNumberSymbol(configuration.dailyNumber),
    primaryColor: getColorSymbol(configuration.primaryColor),
    secondaryColor: getColorSymbol(configuration.secondaryColor),
    form: getFormSymbol(configuration.form),
    direction: getDirectionSymbol(configuration.direction),
  };
}
