import { isLocalDateKey } from "./prng";
import { getPathGrammar } from "./pathGrammars";
import { getSeasonIndex } from "./seasons";
import { GROWTH_METRICS } from "./types";
import { deriveWeatherState } from "./weather";
import type {
  CareAction,
  CareActionSource,
  DailyEntry,
  GrowthDelta,
  GrowthEvent,
  GrowthMetric,
  GrowthTrace,
  LandscapeComposition,
  LandscapeLocale,
  LivingLandscape,
  PatternConfiguration,
  Profile,
  ReflectionOutput,
  TimeOfDay,
  WeatherState,
} from "./types";

export const CARE_ACTION_GROWTH_FIELDS: Readonly<
  Record<CareAction, readonly GrowthMetric[]>
> = {
  nourish: ["branchReach", "canopyDensity", "bloomDensity"],
  release: ["releasedLayers", "skyOpenness"],
  protect: ["canopyDensity", "shelterDensity", "rootEnclosure"],
  open: ["branchReach", "skyOpenness", "pathReach"],
  observe: ["reflectionClarity", "starPresence"],
};

export function createEmptyGrowthDelta(): GrowthDelta {
  return {
    trunkContinuity: 0,
    branchReach: 0,
    canopyDensity: 0,
    bloomDensity: 0,
    releasedLayers: 0,
    skyOpenness: 0,
    shelterDensity: 0,
    rootEnclosure: 0,
    pathReach: 0,
    reflectionClarity: 0,
    starPresence: 0,
  };
}

const round = (value: number, places = 3): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

const actionIntensity = (pattern?: PatternConfiguration): number => {
  if (!pattern) return 0.1;
  const deterministicVariation =
    (pattern.dailyNumber + pattern.layerCount + Math.round(pattern.density * 10)) % 6;
  return round(0.075 + deterministicVariation * 0.009);
};

/** Returns only the fields a care action is permitted to change. */
export function deriveCareActionGrowth(
  careAction: CareAction,
  pattern?: PatternConfiguration,
): GrowthDelta {
  const delta = createEmptyGrowthDelta();
  const intensity = actionIntensity(pattern);
  const fields = CARE_ACTION_GROWTH_FIELDS[careAction];

  fields.forEach((field, index) => {
    delta[field] = round(intensity * (1 - index * 0.12));
  });
  return delta;
}

const cloneWeather = (weather: WeatherState): WeatherState => ({ ...weather });

const clonePattern = (pattern: PatternConfiguration): PatternConfiguration => ({
  ...pattern,
  opacityProfile: { ...pattern.opacityProfile },
  scores: { ...pattern.scores },
});

const cloneReflection = (reflection: ReflectionOutput): ReflectionOutput => ({
  ...reflection,
  evidence: [...reflection.evidence] as [string, string],
});

export function cloneGrowthEvent(event: GrowthEvent): GrowthEvent {
  return {
    ...event,
    checkIn: { ...event.checkIn },
    weather: cloneWeather(event.weather),
    pattern: clonePattern(event.pattern),
    reflection: cloneReflection(event.reflection),
    ...(event.reframe ? { reframe: clonePattern(event.reframe) } : {}),
    ...(event.reframeReflection
      ? { reframeReflection: cloneReflection(event.reframeReflection) }
      : {}),
  };
}

export interface GrowthEventFromDailyEntryOptions {
  careAction: CareAction;
  localeAtCreation: LandscapeLocale;
  timeOfDay: TimeOfDay;
  careActionSource?: CareActionSource;
}

/**
 * Public bridge from the preserved V1 daily model to V2 living-world state.
 * The original/reframed relationship and all safe local metadata are retained.
 */
export function createGrowthEventFromDailyEntry(
  entry: DailyEntry,
  options: GrowthEventFromDailyEntryOptions,
): GrowthEvent {
  return {
    date: entry.date,
    path: entry.original.configuration.pathNumber,
    checkIn: { ...entry.checkIn },
    careAction: options.careAction,
    careActionSource: options.careActionSource ?? (entry.isSample ? "sample" : "user"),
    weather: deriveWeatherState(entry.checkIn, options.timeOfDay),
    pattern: clonePattern(entry.original.configuration),
    reflection: cloneReflection(entry.original.reflection),
    activeVariant: entry.activeVariant,
    localeAtCreation: options.localeAtCreation,
    isSample: entry.isSample,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    ...(entry.sampleLabel ? { sampleLabel: entry.sampleLabel } : {}),
    ...(entry.feedback ? { feedback: entry.feedback } : {}),
    ...(entry.reframe
      ? {
          reframe: clonePattern(entry.reframe.configuration),
          reframeReflection: cloneReflection(entry.reframe.reflection),
        }
      : {}),
  };
}

export function createLivingLandscape(
  profile: Pick<Profile, "id" | "pathNumber" | "createdAt">,
  currentLocale: LandscapeLocale = "en",
  lastVisitedAt: string = profile.createdAt,
): LivingLandscape {
  if (profile.id.trim().length === 0) throw new TypeError("Profile ID is required.");
  getPathGrammar(profile.pathNumber);
  return {
    version: 2,
    profileId: profile.id,
    path: profile.pathNumber,
    events: [],
    seasonIndex: 0,
    lastVisitedAt,
    currentLocale,
  };
}

/**
 * Adds or replaces one local date. Re-applying the same event is idempotent and
 * cannot create duplicate daily growth.
 */
export function applyGrowthEvent(
  landscape: LivingLandscape,
  event: GrowthEvent,
  visitedAt: string = event.updatedAt ?? event.createdAt ?? event.date,
): LivingLandscape {
  if (!isLocalDateKey(event.date)) throw new RangeError("Growth event date is invalid.");
  if (event.pattern.date !== event.date) {
    throw new TypeError("Growth event and Daily Sigil dates must match.");
  }
  if (event.path !== landscape.path || event.pattern.pathNumber !== event.path) {
    throw new TypeError("Growth event Path must match the living landscape.");
  }

  const events = [
    ...landscape.events.filter((existing) => existing.date !== event.date).map(cloneGrowthEvent),
    cloneGrowthEvent(event),
  ].sort((left, right) => left.date.localeCompare(right.date));

  return {
    ...landscape,
    events,
    seasonIndex: getSeasonIndex(events.length),
    lastVisitedAt: visitedAt,
    ...(landscape.sampleWeek
      ? { sampleWeek: { ...landscape.sampleWeek, dates: [...landscape.sampleWeek.dates] } }
      : {}),
  };
}

/** Absence changes no growth state; a visit only records recency. */
export function recordLandscapeVisit(
  landscape: LivingLandscape,
  visitedAt: string,
): LivingLandscape {
  return {
    ...landscape,
    events: landscape.events.map(cloneGrowthEvent),
    lastVisitedAt: visitedAt,
    ...(landscape.sampleWeek
      ? { sampleWeek: { ...landscape.sampleWeek, dates: [...landscape.sampleWeek.dates] } }
      : {}),
  };
}

const addDelta = (target: GrowthDelta, delta: GrowthDelta): void => {
  GROWTH_METRICS.forEach((metric) => {
    target[metric] = round(Math.min(1, target[metric] + delta[metric]));
  });
};

const traceForEvent = (event: GrowthEvent): GrowthTrace => {
  const grammar = getPathGrammar(event.path);
  const featureIndex = (event.pattern.dailyNumber + event.pattern.layerCount) % grammar.growthFeatures.length;
  const targetIndex = (event.pattern.dailyNumber + event.pattern.rotation) % grammar.sigilMergeTargets.length;
  return {
    date: event.date,
    path: event.path,
    careAction: event.careAction,
    feature: grammar.growthFeatures[featureIndex] ?? grammar.growthFeatures[0] ?? "branch",
    mergeTarget:
      grammar.sigilMergeTargets[targetIndex] ?? grammar.sigilMergeTargets[0] ?? "branch-node",
    intensity: actionIntensity(event.pattern),
  };
};

export function composeLivingLandscape(landscape: LivingLandscape): LandscapeComposition {
  const metrics = createEmptyGrowthDelta();
  const events = [...landscape.events].sort((left, right) => left.date.localeCompare(right.date));

  events.forEach((event) => {
    metrics.trunkContinuity = round(
      Math.min(1, metrics.trunkContinuity + 0.025 + event.pattern.density * 0.015),
    );
    addDelta(metrics, deriveCareActionGrowth(event.careAction, event.pattern));
  });

  return {
    profileId: landscape.profileId,
    path: landscape.path,
    grammar: getPathGrammar(landscape.path),
    eventCount: events.length,
    seasonIndex: getSeasonIndex(events.length),
    metrics,
    traces: events.map(traceForEvent),
  };
}
