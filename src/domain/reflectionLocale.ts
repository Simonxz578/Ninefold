import { hashSeed } from "./prng";
import { getPathGrammar } from "./pathGrammars";
import { REFLECTION_DISCLAIMER } from "./reflection";
import type {
  CareAction,
  ColorName,
  DailyCheckIn,
  DailyEntry,
  Focus,
  GeometricForm,
  GrowthEvent,
  LandscapeLocale,
  PathNumber,
  PatternConfiguration,
  ReflectionOutput,
  VisualDirection,
} from "./types";

export const REFLECTION_DISCLAIMER_ZH =
  "Ninefold 是一种创造性的自我回望体验，并非诊断、心理咨询或占卜服务。";

export interface ReflectionSemanticInput {
  path: PathNumber;
  checkIn: DailyCheckIn;
  configuration: PatternConfiguration;
  careAction?: CareAction;
}

export type LocalisableReflectionSource = ReflectionSemanticInput | DailyEntry | GrowthEvent;

const FOCUS_EN: Readonly<Record<Focus, string>> = {
  work: "work",
  study: "study",
  relationships: "relationships",
  creativity: "creativity",
  self: "self",
};

const FOCUS_ZH: Readonly<Record<Focus, string>> = {
  work: "工作",
  study: "学习",
  relationships: "关系",
  creativity: "创造",
  self: "自我",
};

export interface ChineseSemanticLabels {
  colours: Readonly<Record<ColorName, string>>;
  forms: Readonly<Record<GeometricForm, string>>;
  directions: Readonly<Record<VisualDirection, string>>;
}

/**
 * Canonical Chinese labels for deterministic configuration enums.
 *
 * Keeping these labels beside the independently authored reflection templates
 * lets every Chinese surface render semantic values without leaking the raw
 * English storage representation.
 */
export const ZH_SEMANTIC_LABELS: ChineseSemanticLabels = {
  colours: {
    Indigo: "靛蓝",
    Amber: "琥珀",
    Teal: "青绿",
    Rose: "玫瑰色",
    Moss: "苔绿色",
    Cobalt: "钴蓝",
    Violet: "紫罗兰色",
    Coral: "珊瑚色",
    Slate: "石板灰",
    Pearl: "珍珠白",
    Ochre: "赭色",
    Crimson: "绯红",
  },
  forms: {
    circle: "圆形",
    triangle: "三角形",
    square: "方形",
    pentagon: "五边形",
    hexagon: "六边形",
    diamond: "菱形",
    ring: "圆环",
    star: "星形",
    spiral: "螺旋",
  },
  directions: {
    inward: "向内",
    outward: "向外",
    ascending: "向上",
    descending: "向下",
    balanced: "平衡地",
    rotating: "沿着环流",
  },
};

const FORM_ZH = ZH_SEMANTIC_LABELS.forms;
const COLOUR_ZH = ZH_SEMANTIC_LABELS.colours;
const DIRECTION_ZH = ZH_SEMANTIC_LABELS.directions;

const CONNECTION_EN = {
  inward: "turned inward",
  balanced: "balanced between inner and outer attention",
  outward: "turned toward the world around you",
} as const;

const CONNECTION_ZH = {
  inward: "更靠近内在",
  balanced: "在内外之间保持平衡",
  outward: "更多地朝向外界",
} as const;

const ACTION_EN: Readonly<Record<Focus, string>> = {
  work: "Choose one unfinished task and name only its next visible step.",
  study: "Return to one uncertain idea and explain it in five plain sentences.",
  relationships: "Ask one direct, gentle question instead of filling in the silence.",
  creativity: "Give one unfinished idea a rough form before deciding whether it works.",
  self: "Remove one unnecessary demand and give that space a definite boundary.",
};

const ACTION_ZH: Readonly<Record<Focus, string>> = {
  work: "从一件尚未完成的事里，只写下眼前看得见的下一步。",
  study: "回到一个还不确定的概念，用五句清楚的话把它讲出来。",
  relationships: "与其替沉默补上答案，不如温和而直接地问一个问题。",
  creativity: "先给那个尚未完成的念头一个粗略形状，再判断它是否成立。",
  self: "减去一个并不必要的要求，并为留下的空间划出清楚边界。",
};

const QUESTIONS_EN: Readonly<Record<Focus, readonly [string, string]>> = {
  work: [
    "Which outcome needs a clear next step more than it needs more thought?",
    "What would count as complete enough for today?",
  ],
  study: [
    "Which uncertainty would unlock the most understanding if examined first?",
    "Where does your explanation become vague?",
  ],
  relationships: [
    "What could be asked directly rather than inferred?",
    "Where can warmth and a clear boundary coexist today?",
  ],
  creativity: [
    "What could take rough form before it is evaluated?",
    "Which constraint might help the idea become more distinct?",
  ],
  self: [
    "What would make today's pace more sustainable?",
    "Which demand is real, and which one have you added yourself?",
  ],
};

const QUESTIONS_ZH: Readonly<Record<Focus, readonly [string, string]>> = {
  work: [
    "哪一个结果现在更需要清楚的下一步，而不是更多思考？",
    "对今天而言，做到什么程度就已经足够完整？",
  ],
  study: [
    "先看清哪一个疑问，最能带动接下来的理解？",
    "当你试着解释时，哪一处开始变得含糊？",
  ],
  relationships: [
    "有什么可以直接问清，而不必依靠猜测？",
    "今天，温和与清楚的边界可以在哪里同时存在？",
  ],
  creativity: [
    "有什么可以先长出粗略形状，再接受判断？",
    "哪一种限制反而能让这个念头更清楚？",
  ],
  self: [
    "什么会让今天的节奏更容易持续？",
    "哪一个要求确实存在，哪一个是你后来加给自己的？",
  ],
};

const CARE_OPPORTUNITY_EN: Readonly<Record<CareAction, string>> = {
  nourish: "Keep one worthwhile thing supplied with enough attention to continue.",
  release: "Set down one unnecessary burden so the important part has room.",
  protect: "Give the unfinished idea enough shelter to remain incomplete today.",
  open: "Leave an opening for a new possibility without deciding its destination yet.",
  observe: "Do not force a change today; first notice the shape already present.",
};

const CARE_OPPORTUNITY_ZH: Readonly<Record<CareAction, string>> = {
  nourish: "把今天有限的注意力留给一件值得继续生长的事。",
  release: "先放下一个并不必要的负担，给真正重要的部分腾出空间。",
  protect: "先守住那个尚未成形的念头，不必急着让它今天就有答案。",
  open: "给新的可能留一道开口，不必马上决定它会走向哪里。",
  observe: "今天不必强求改变，先把已经出现的轮廓看清。",
};

function toSemanticInput(source: LocalisableReflectionSource): ReflectionSemanticInput {
  if ("original" in source) {
    const version = source.activeVariant === "reframe" && source.reframe
      ? source.reframe
      : source.original;
    return {
      path: version.configuration.pathNumber,
      checkIn: source.checkIn,
      configuration: version.configuration,
    };
  }
  if ("pattern" in source) {
    const configuration = source.activeVariant === "reframe" && source.reframe
      ? source.reframe
      : source.pattern;
    return {
      path: source.path,
      checkIn: source.checkIn,
      configuration,
      careAction: source.careAction,
    };
  }
  return source;
}

function tensionEnglish(checkIn: DailyCheckIn): string {
  if (checkIn.energy <= 2 && checkIn.clarity >= 4) {
    return "The direction is visible; the part that needs care is the energy available to carry it.";
  }
  if (checkIn.energy >= 4 && checkIn.clarity <= 2) {
    return "Today asks for room, not speed; available energy is moving ahead of clarity.";
  }
  if (checkIn.connection === "inward") {
    return "Looking inward can sharpen discernment, though it may postpone a useful response.";
  }
  if (checkIn.connection === "outward") {
    return "Contact is creating movement; a small pause can keep response from outrunning understanding.";
  }
  return "Several needs are sharing the frame; one small workable choice can keep balance from becoming delay.";
}

function tensionChinese(checkIn: DailyCheckIn): string {
  if (checkIn.energy <= 2 && checkIn.clarity >= 4) {
    return "方向已经看清，真正需要照顾的是承载它的精力。";
  }
  if (checkIn.energy >= 4 && checkIn.clarity <= 2) {
    return "今天需要的不是更快，而是留出空间；行动的力量正走在清晰之前。";
  }
  if (checkIn.connection === "inward") {
    return "向内看能带来辨别，也可能让一次必要的回应被暂时搁置。";
  }
  if (checkIn.connection === "outward") {
    return "与外界的连接正在增多，留一点停顿能避免反应快过理解。";
  }
  return "几种需要同时出现在眼前时，先选一个足够小的动作，平衡就不必变成拖延。";
}

/**
 * Formats the same deterministic semantic variables through independently
 * authored English and Chinese templates. It never mutates or regenerates the
 * supplied PatternConfiguration.
 */
export function formatReflectionForLocale(
  source: LocalisableReflectionSource,
  locale: LandscapeLocale,
): ReflectionOutput {
  const semantic = toSemanticInput(source);
  if (semantic.path !== semantic.configuration.pathNumber) {
    throw new TypeError("Reflection Path must match the Daily Sigil configuration.");
  }
  const grammar = getPathGrammar(semantic.path);
  const { checkIn, configuration, careAction } = semantic;
  const variant = hashSeed(`${configuration.seed}|localized-reflection-v2`) % 2;
  const questionIndex = hashSeed(`${configuration.seed}|localized-question-v2`) % 2;

  if (locale === "zh-CN") {
    const theme = variant === 0
      ? `${DIRECTION_ZH[configuration.direction]}展开的${FORM_ZH[configuration.form]}印记`
      : `「${grammar.name.zh}」与${COLOUR_ZH[configuration.primaryColor]}微光`;
    return {
      theme,
      evidence: [
        `今天的精力是 ${checkIn.energy}/5，清晰度是 ${checkIn.clarity}/5，注意力${CONNECTION_ZH[checkIn.connection]}，此刻更关心${FOCUS_ZH[checkIn.focus]}。`,
        `心径「${grammar.name.zh}」与数字 ${configuration.dailyNumber} 相遇，留下${COLOUR_ZH[configuration.primaryColor]}、${FORM_ZH[configuration.form]}和${DIRECTION_ZH[configuration.direction]}的痕迹。`,
      ],
      tension: tensionChinese(checkIn),
      opportunity:
        careAction !== undefined
          ? CARE_OPPORTUNITY_ZH[careAction]
          : "先从你能看见的状态出发，不必急着给今天定性。",
      action: ACTION_ZH[checkIn.focus],
      reflectionQuestion: QUESTIONS_ZH[checkIn.focus][questionIndex] ?? QUESTIONS_ZH.self[0],
      disclaimer: REFLECTION_DISCLAIMER_ZH,
    };
  }

  const theme = variant === 0
    ? `${configuration.form[0]?.toUpperCase()}${configuration.form.slice(1)} in ${configuration.direction} light`
    : `${grammar.name.en} with ${configuration.primaryColor.toLowerCase()} light`;
  return {
    theme,
    evidence: [
      `Energy ${checkIn.energy}/5 and clarity ${checkIn.clarity}/5 place today's ${FOCUS_EN[checkIn.focus]} focus ${CONNECTION_EN[checkIn.connection]}.`,
      `Path ${semantic.path} (${grammar.name.en}) meets daily number ${configuration.dailyNumber}, leaving ${configuration.primaryColor}, a ${configuration.form} and ${configuration.direction} direction.`,
    ],
    tension: tensionEnglish(checkIn),
    opportunity:
      careAction !== undefined
        ? CARE_OPPORTUNITY_EN[careAction]
        : "Begin with the state you can observe without deciding what kind of day it must become.",
    action: ACTION_EN[checkIn.focus],
    reflectionQuestion: QUESTIONS_EN[checkIn.focus][questionIndex] ?? QUESTIONS_EN.self[0],
    disclaimer: REFLECTION_DISCLAIMER,
  };
}
