export const PATH_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export type PathNumber = (typeof PATH_NUMBERS)[number];
export type DailyNumber = PathNumber;
export type RatingFive = 1 | 2 | 3 | 4 | 5;
export type ScoreNine = PathNumber;

export const COLOR_NAMES = [
  "Indigo",
  "Amber",
  "Teal",
  "Rose",
  "Moss",
  "Cobalt",
  "Violet",
  "Coral",
  "Slate",
  "Pearl",
  "Ochre",
  "Crimson",
] as const;

export type ColorName = (typeof COLOR_NAMES)[number];

export const FORM_NAMES = [
  "circle",
  "triangle",
  "square",
  "pentagon",
  "hexagon",
  "diamond",
  "ring",
  "star",
  "spiral",
] as const;

export type GeometricForm = (typeof FORM_NAMES)[number];

export const DIRECTIONS = [
  "inward",
  "outward",
  "ascending",
  "descending",
  "balanced",
  "rotating",
] as const;

export type VisualDirection = (typeof DIRECTIONS)[number];
export type Symmetry = "radial" | "bilateral" | "rotational" | "asymmetric";
export type Focus = "work" | "study" | "relationships" | "creativity" | "self";
export type Connection = "inward" | "balanced" | "outward";
export type PatternVariant = "original" | "reframe";

export type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export interface PreferenceLenses {
  orientation?: "internal" | "neutral" | "external";
  approach?: "structured" | "neutral" | "exploratory";
  processing?: "analytical" | "neutral" | "intuitive";
  pace?: "stable" | "neutral" | "adaptive";
}

export interface Profile {
  id: string;
  displayName?: string;
  pathNumber: PathNumber;
  zodiacSign?: ZodiacSign;
  lenses?: PreferenceLenses;
  createdAt: string;
}

export interface DailyCheckIn {
  energy: RatingFive;
  clarity: RatingFive;
  connection: Connection;
  focus: Focus;
  note?: string;
}

export interface DailyScores {
  clarity: ScoreNine;
  momentum: ScoreNine;
  tension: ScoreNine;
}

export interface OpacityProfile {
  base: number;
  accent: number;
  line: number;
}

export interface PatternConfiguration {
  generatorVersion: string;
  dictionaryVersion: string;
  seed: string;
  date: string;
  variant: PatternVariant;
  pathNumber: PathNumber;
  dailyNumber: DailyNumber;
  primaryColor: ColorName;
  secondaryColor: ColorName;
  form: GeometricForm;
  rotation: number;
  layerCount: number;
  density: number;
  direction: VisualDirection;
  symmetry: Symmetry;
  lineWeight: number;
  opacityProfile: OpacityProfile;
  scores: DailyScores;
}

export interface ReflectionOutput {
  theme: string;
  evidence: [string, string];
  tension: string;
  opportunity: string;
  action: string;
  reflectionQuestion: string;
  disclaimer: string;
}

export interface DailyVersion {
  configuration: PatternConfiguration;
  reflection: ReflectionOutput;
}

export type FeedbackChoice =
  | "useful"
  | "too-generic"
  | "too-negative"
  | "did-not-match";

export interface DailyEntry {
  date: string;
  profileId: string;
  /** Local snapshot used to keep a Reframe anchored to the original profile inputs. */
  profileSnapshot?: Profile;
  checkIn: DailyCheckIn;
  original: DailyVersion;
  reframe?: DailyVersion;
  activeVariant: PatternVariant;
  reframeUsed: boolean;
  isSample: boolean;
  sampleLabel?: string;
  feedback?: FeedbackChoice;
  createdAt: string;
  updatedAt: string;
}

export interface RecentSummary {
  date: string;
  dailyNumber: DailyNumber;
  primaryColor: ColorName;
  form: GeometricForm;
  direction: VisualDirection;
  scores: DailyScores;
  theme: string;
}

export interface WeeklyReflection {
  theme: string;
  observations: string[];
  invitation: string;
  averages: DailyScores;
  frequentColors: ColorName[];
  repeatedForms: GeometricForm[];
  dominantDirection: VisualDirection;
}

export interface FeedbackRecord {
  date: string;
  choice: FeedbackChoice;
  recordedAt: string;
}

export interface SampleWeekState {
  loaded: boolean;
  dates: string[];
  loadedAt?: string;
}

export const CARE_ACTIONS = [
  "nourish",
  "release",
  "protect",
  "open",
  "observe",
] as const;

export type CareAction = (typeof CARE_ACTIONS)[number];
export type CareActionSource = "user" | "migrated-default" | "sample";

export const TIMES_OF_DAY = ["morning", "day", "evening", "night"] as const;

export type TimeOfDay = (typeof TIMES_OF_DAY)[number];
export type LandscapeLocale = "en" | "zh-CN";

/**
 * Normalised weather values use the inclusive 0–1 range so renderers can map
 * the same domain state to CSS, SVG or a text alternative without re-deriving it.
 */
export interface WeatherState {
  skyClarity: number;
  cloudDensity: number;
  rainIntensity: number;
  windStrength: number;
  sunlight: number;
  starVisibility: number;
  timeOfDay: TimeOfDay;
  motionBias: Connection;
  focusMotif: Focus;
}

export type PathSilhouette =
  | "ascending-spire"
  | "paired-arc"
  | "flowering-radiance"
  | "tiered-terrace"
  | "wind-swept-flow"
  | "sheltering-canopy"
  | "mirrored-depth"
  | "crystalline-ascent"
  | "seasonal-circle";

export type BranchPattern =
  | "single-leading"
  | "paired-bridging"
  | "petal-radiating"
  | "modular-tiered"
  | "forking-ribbons"
  | "enclosing-nested"
  | "inward-spiral"
  | "faceted-nodes"
  | "cyclical-integrated";

export type RootPattern =
  | "forward-path"
  | "linked-pairs"
  | "seed-scatter"
  | "geometric-terraces"
  | "stream-delta"
  | "soft-enclosure"
  | "submerged-depth"
  | "mountain-foundation"
  | "renewal-ring";

export type PathBiome =
  | "sunlit-meadow"
  | "converging-streams"
  | "flowering-field"
  | "terraced-garden"
  | "wind-and-water"
  | "sheltered-grove"
  | "reflective-lake"
  | "crystal-highland"
  | "integrated-seasons";

export type GrowthFeature =
  | "trunk"
  | "branch"
  | "leaf"
  | "flower"
  | "fruit"
  | "root"
  | "bridge"
  | "path"
  | "terrace"
  | "canopy"
  | "nest"
  | "pool"
  | "stream"
  | "star"
  | "crystal"
  | "nebula"
  | "reflection"
  | "seasonal-ring";

export type SigilMergeTarget =
  | "flower"
  | "fruit"
  | "branch-node"
  | "root-mark"
  | "water-mark"
  | "bridge-motif"
  | "crystal-face"
  | "constellation"
  | "nebula-node"
  | "seasonal-ring";

export interface PathGrammar {
  pathNumber: PathNumber;
  name: Readonly<{ en: string; zh: string }>;
  silhouette: PathSilhouette;
  branchPattern: BranchPattern;
  rootPattern: RootPattern;
  biome: PathBiome;
  symmetry: Symmetry;
  orientation: VisualDirection;
  growthFeatures: readonly GrowthFeature[];
  sigilMergeTargets: readonly SigilMergeTarget[];
}

export interface GrowthEvent {
  date: string;
  path: PathNumber;
  checkIn: DailyCheckIn;
  careAction: CareAction;
  careActionSource?: CareActionSource;
  weather: WeatherState;
  pattern: PatternConfiguration;
  reflection: ReflectionOutput;
  reframe?: PatternConfiguration;
  reframeReflection?: ReflectionOutput;
  activeVariant?: PatternVariant;
  localeAtCreation?: LandscapeLocale;
  isSample?: boolean;
  sampleLabel?: string;
  feedback?: FeedbackChoice;
  createdAt?: string;
  updatedAt?: string;
}

export interface LivingLandscape {
  version: 2;
  profileId: string;
  path: PathNumber;
  events: GrowthEvent[];
  seasonIndex: number;
  lastVisitedAt: string;
  currentLocale: LandscapeLocale;
  sampleWeek?: SampleWeekState;
}

export const GROWTH_METRICS = [
  "trunkContinuity",
  "branchReach",
  "canopyDensity",
  "bloomDensity",
  "releasedLayers",
  "skyOpenness",
  "shelterDensity",
  "rootEnclosure",
  "pathReach",
  "reflectionClarity",
  "starPresence",
] as const;

export type GrowthMetric = (typeof GROWTH_METRICS)[number];
export type GrowthDelta = Record<GrowthMetric, number>;

export interface GrowthTrace {
  date: string;
  path: PathNumber;
  careAction: CareAction;
  feature: GrowthFeature;
  mergeTarget: SigilMergeTarget;
  intensity: number;
}

export interface LandscapeComposition {
  profileId: string;
  path: PathNumber;
  grammar: PathGrammar;
  eventCount: number;
  seasonIndex: number;
  metrics: GrowthDelta;
  traces: GrowthTrace[];
}
