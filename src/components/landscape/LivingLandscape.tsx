import { useId } from "react";
import type {
  CareAction,
  GrowthEvent,
  LandscapeLocale,
  PathNumber,
  PatternConfiguration,
  WeatherState,
} from "../../domain/types";
import type { GrowthStage } from "../../domain/restSession";
import { getPathGrammar } from "../../domain/pathGrammars";
import { dictionaries, interpolate, type TranslationDictionary } from "../../i18n";
import "../../living-world.css";
import { DailySigilMerge } from "./DailySigilMerge";
import { clampUnit, sanitiseSvgId } from "./geometry";
import { CloudLayer, GroundLayer, SkyLayer, WaterLayer, WeatherEffects } from "./LandscapeLayers";
import { PathGrowthLayer } from "./PathGrowthLayer";
import { WorldTree } from "./WorldTree";

const DEFAULT_WEATHER: WeatherState = {
  skyClarity: 0.72,
  cloudDensity: 0.28,
  rainIntensity: 0,
  windStrength: 0.22,
  sunlight: 0.78,
  starVisibility: 0,
  timeOfDay: "day",
  motionBias: "balanced",
  focusMotif: "self",
};

export interface LivingLandscapeProps {
  path: PathNumber;
  weather?: WeatherState;
  events?: readonly GrowthEvent[];
  activePattern?: PatternConfiguration;
  careAction?: CareAction;
  seasonIndex?: number;
  locale?: LandscapeLocale;
  title?: string;
  description?: string;
  className?: string;
  keyArtBackdrop?: boolean;
  restMode?: boolean;
  growthStage?: GrowthStage;
}

export function LivingLandscape({
  path,
  weather,
  events = [],
  activePattern,
  careAction,
  seasonIndex = 0,
  locale = "en",
  title,
  description,
  className = "",
  keyArtBackdrop = false,
  restMode = false,
  growthStage = 0,
}: LivingLandscapeProps) {
  const reactId = useId();
  const idPrefix = `nf-landscape-${sanitiseSvgId(reactId)}`;
  const grammar = getPathGrammar(path);
  const copy = dictionaries[locale].landscape.livingLandscape;
  const grammarName = { en: grammar.name.en, "zh-CN": grammar.name.zh }[locale];
  const latestEvent = events.at(-1);
  const currentWeather = weather ?? latestEvent?.weather ?? DEFAULT_WEATHER;
  const currentPattern = activePattern
    ?? (latestEvent?.activeVariant === "reframe" && latestEvent.reframe ? latestEvent.reframe : latestEvent?.pattern);
  const currentCareAction = careAction ?? latestEvent?.careAction;
  const growth = clampUnit(0.22 + Math.min(events.length, 28) / 36 + Math.min(seasonIndex, 8) * 0.035);
  const resolvedTitle = title ?? interpolate(copy.title, { path, pathName: grammarName });
  const descriptionTemplate = events.length === 1 ? copy.descriptionSingular : copy.descriptionPlural;
  const resolvedDescription = description ?? interpolate(descriptionTemplate, {
    pathName: grammarName.toLocaleLowerCase(locale),
    count: events.length,
    weather: timeLabel(currentWeather, copy),
  });
  return (
    <figure
      className={`living-world living-world--path-${path} living-world--session-stage-${growthStage}${restMode ? " living-world--rest" : ""} ${className}`.trim()}
      data-care-action={currentCareAction}
      data-season={seasonIndex}
      data-time={currentWeather.timeOfDay}
      data-growth-stage={growthStage}
      aria-labelledby={`${idPrefix}-title`}
      aria-describedby={`${idPrefix}-description`}
    >
      <figcaption className="living-world__sr-only">
        <span id={`${idPrefix}-title`}>{resolvedTitle}</span>
        <span id={`${idPrefix}-description`}>{resolvedDescription}</span>
      </figcaption>
      {keyArtBackdrop && (
        <img
          className="living-world__key-art"
          src={`${import.meta.env.BASE_URL}brand/ninefold-world-tree-key-art.webp`}
          alt=""
          aria-hidden="true"
        />
      )}
      <svg
        className="living-world__scene"
        viewBox="0 0 1200 720"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <SkyLayer weather={currentWeather} idPrefix={idPrefix} />
        <CloudLayer weather={currentWeather} idPrefix={idPrefix} />
        <WaterLayer weather={currentWeather} idPrefix={idPrefix} />
        <GroundLayer weather={currentWeather} idPrefix={idPrefix} />
        <PathGrowthLayer path={path} events={events} />
        <WorldTree
          path={path}
          growth={growth}
          eventCount={events.length}
          idPrefix={idPrefix}
          growthStage={growthStage}
        />
        <DailySigilMerge path={path} pattern={currentPattern} />
        <WeatherEffects weather={currentWeather} idPrefix={idPrefix} seed={currentPattern?.seed ?? `${path}:${seasonIndex}`} />
      </svg>
      <span className="living-world__edge-shade" aria-hidden="true" />
    </figure>
  );
}

function timeLabel(
  weather: WeatherState,
  copy: TranslationDictionary["landscape"]["livingLandscape"],
): string {
  const time = copy.times[weather.timeOfDay];
  const template = weather.rainIntensity > 0.45
    ? copy.weather.rain
    : weather.cloudDensity > 0.62
      ? copy.weather.clouded
      : weather.sunlight > 0.62
        ? copy.weather.sunlight
        : copy.weather.softLight;
  return interpolate(template, { time });
}
