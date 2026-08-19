import type { CSSProperties } from "react";
import type { WeatherState } from "../../domain/types";
import { clampUnit } from "./geometry";

interface LayerProps {
  weather: WeatherState;
  idPrefix: string;
}

interface WeatherLayerProps extends LayerProps {
  seed: string;
}

const CLOUDS = [
  { x: 96, y: 158, scale: 0.78 },
  { x: 350, y: 108, scale: 0.58 },
  { x: 710, y: 156, scale: 0.92 },
  { x: 1010, y: 88, scale: 0.48 },
] as const;

const STARS = [
  [85, 74], [146, 125], [214, 58], [286, 106], [352, 46], [421, 146],
  [505, 74], [575, 122], [650, 42], [724, 92], [805, 58], [875, 138],
  [956, 76], [1024, 120], [1102, 54], [1160, 154], [744, 180], [278, 180],
] as const;

const RAIN = [
  [86, 184], [148, 220], [220, 170], [286, 246], [356, 198], [428, 154],
  [502, 230], [576, 182], [646, 254], [716, 206], [790, 164], [858, 238],
  [932, 188], [1000, 250], [1074, 172], [1140, 222],
] as const;

export function SkyLayer({ weather, idPrefix }: LayerProps) {
  const sunPosition = weather.timeOfDay === "morning"
    ? { x: 250, y: 188 }
    : weather.timeOfDay === "evening"
      ? { x: 930, y: 190 }
      : { x: 690, y: 92 };
  const style = {
    "--nf-sunlight": clampUnit(weather.sunlight).toString(),
    "--nf-nebula-opacity": (0.12 + clampUnit(weather.skyClarity) * 0.72).toString(),
  } as CSSProperties;

  return (
    <g className={`living-world__sky living-world__sky--${weather.timeOfDay}`} style={style}>
      <defs>
        <linearGradient id={`${idPrefix}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop className="living-world__sky-stop living-world__sky-stop--zenith" offset="0" />
          <stop className="living-world__sky-stop living-world__sky-stop--horizon" offset="1" />
        </linearGradient>
        <radialGradient id={`${idPrefix}-sun`}>
          <stop offset="0" stopColor="#fffbe0" stopOpacity=".96" />
          <stop offset=".24" stopColor="#ffe99e" stopOpacity=".64" />
          <stop offset="1" stopColor="#f6d983" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-nebula`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b78c8" stopOpacity=".04" />
          <stop offset=".48" stopColor="#5e8fcf" stopOpacity=".3" />
          <stop offset="1" stopColor="#d39ac2" stopOpacity=".06" />
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill={`url(#${idPrefix}-sky)`} />
      <ellipse className="living-world__nebula" cx="650" cy="54" rx="470" ry="190" fill={`url(#${idPrefix}-nebula)`} />
      <circle className="living-world__sun" cx={sunPosition.x} cy={sunPosition.y} r="126" fill={`url(#${idPrefix}-sun)`} />
      <path className="living-world__distant-ridge" d="M0 420 132 334 228 386 360 308 470 376 588 290 710 374 830 320 948 390 1060 318 1200 374V530H0Z" />
      <path className="living-world__distant-ridge living-world__distant-ridge--near" d="M0 450 150 382 260 426 390 362 510 430 650 350 792 425 914 370 1045 420 1200 360V535H0Z" />
    </g>
  );
}

export function CloudLayer({ weather }: LayerProps) {
  const style = {
    "--nf-cloud-opacity": (0.08 + clampUnit(weather.cloudDensity) * 0.72).toString(),
    "--nf-cloud-drift": `${34 - clampUnit(weather.windStrength) * 14}s`,
  } as CSSProperties;

  return (
    <g className="living-world__cloud-layer" style={style}>
      {CLOUDS.map((cloud, index) => (
        <g
          className={`living-world__cloud living-world__cloud--${index % 2 === 0 ? "forward" : "reverse"}`}
          key={`${cloud.x}-${cloud.y}`}
          transform={`translate(${cloud.x} ${cloud.y}) scale(${cloud.scale})`}
        >
          <ellipse cx="0" cy="16" rx="94" ry="30" />
          <ellipse cx="-42" cy="0" rx="48" ry="34" />
          <ellipse cx="18" cy="-10" rx="62" ry="44" />
          <ellipse cx="70" cy="10" rx="48" ry="30" />
        </g>
      ))}
    </g>
  );
}

export function WaterLayer({ weather, idPrefix }: LayerProps) {
  const style = {
    "--nf-water-light": (0.16 + clampUnit(weather.sunlight) * 0.54).toString(),
    "--nf-water-shine": ((0.16 + clampUnit(weather.sunlight) * 0.54) * 0.55).toString(),
    "--nf-water-motion": `${12 - clampUnit(weather.windStrength) * 5}s`,
  } as CSSProperties;

  return (
    <g className="living-world__water" style={style}>
      <defs>
        <linearGradient id={`${idPrefix}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fcfe0" stopOpacity=".74" />
          <stop offset="1" stopColor="#376f86" stopOpacity=".92" />
        </linearGradient>
      </defs>
      <path d="M0 494C190 462 360 492 518 476c186-19 348-5 682 10v234H0Z" fill={`url(#${idPrefix}-water)`} />
      <g className="living-world__water-lines">
        <path d="M84 526c122-18 228 10 360-3" />
        <path d="M650 520c124-13 238 9 414-6" />
        <path d="M170 570c170-14 350 15 548-5" />
        <path d="M782 603c96-9 190 8 310-6" />
        <path d="M410 640c156-12 282 8 430-5" />
      </g>
      <ellipse className="living-world__water-shine" cx="620" cy="525" rx="260" ry="31" />
    </g>
  );
}

export function GroundLayer({ weather }: LayerProps) {
  const style = {
    "--nf-ground-opacity": (0.72 + (0.34 + clampUnit(weather.sunlight) * 0.38) * 0.28).toString(),
  } as CSSProperties;

  return (
    <g className="living-world__ground" style={style}>
      <path className="living-world__bank living-world__bank--far" d="M0 478c142-25 255-15 368 11 101 23 202 18 304-11 120-34 292-38 528 8v84H0Z" />
      <path className="living-world__bank living-world__bank--near" d="M0 586c120-52 244-50 354-14 104 34 210 35 324 8 137-33 301-28 522 20v120H0Z" />
      <g className="living-world__grass-marks">
        <path d="m72 640 8-25 5 25m58 24 8-32 8 30m80 24 6-26 9 25m704-26 8-31 7 31m72 20 8-26 8 27m75-36 7-28 8 29" />
        <path d="m320 616 5-22 8 20m530 12 8-24 5 24m-106-44 5-18 7 18" />
      </g>
      <g className="living-world__field-flowers">
        <circle cx="118" cy="626" r="4" /><circle cx="182" cy="674" r="3" />
        <circle cx="276" cy="632" r="3" /><circle cx="896" cy="645" r="4" />
        <circle cx="1022" cy="612" r="3" /><circle cx="1110" cy="667" r="4" />
      </g>
    </g>
  );
}

export function WeatherEffects({ weather, seed }: WeatherLayerProps) {
  const seedOffset = [...seed].reduce((total, character) => total + character.charCodeAt(0), 0) % 17;
  const style = {
    "--nf-rain-opacity": clampUnit(weather.rainIntensity).toString(),
    "--nf-star-opacity": clampUnit(weather.starVisibility).toString(),
    "--nf-breeze-opacity": (clampUnit(weather.windStrength) * 0.32).toString(),
    "--nf-weather-wind": `${2.8 - clampUnit(weather.windStrength) * 0.8}s`,
  } as CSSProperties;

  return (
    <g className="living-world__weather" style={style}>
      <g className="living-world__stars">
        {STARS.map(([x, y], index) => (
          <circle key={`${x}-${y}`} cx={x + ((seedOffset + index) % 7)} cy={y} r={index % 4 === 0 ? 2.2 : 1.25} />
        ))}
      </g>
      <g className="living-world__rain">
        {RAIN.map(([x, y], index) => (
          <path key={`${x}-${y}`} d={`M${x + seedOffset} ${y + (index % 3) * 8}l-10 24`} />
        ))}
      </g>
      <path className="living-world__breeze living-world__breeze--one" d="M70 290c122-34 202 28 326-6" />
      <path className="living-world__breeze living-world__breeze--two" d="M790 326c102-26 181 20 300-4" />
    </g>
  );
}
