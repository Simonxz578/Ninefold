import type { CSSProperties, ReactNode } from "react";
import { getPathGrammar } from "../../domain/pathGrammars";
import type { GrowthStage } from "../../domain/restSession";
import type { PathNumber } from "../../domain/types";
import { clampUnit } from "./geometry";
import { SessionGrowthLayer } from "./SessionGrowthLayer";

export interface TreeGeometry {
  trunk: string;
  trunkSegments?: readonly string[];
  branches: readonly string[];
  roots: readonly string[];
}

// Shared by V3's bare-tree renderer; V2 keeps rendering this component unchanged.
// eslint-disable-next-line react-refresh/only-export-components
export const TREE_GEOMETRY: Readonly<Record<PathNumber, TreeGeometry>> = {
  1: {
    trunk: "M600 592C574 522 592 448 594 378c2-74 5-141 6-206",
    branches: ["M596 414c-54-29-82-68-94-112", "M597 362c48-34 72-73 81-113", "M599 302c-30-32-41-66-42-98", "M601 254c23-29 31-58 32-87"],
    roots: ["M598 580c-58 12-108 40-158 78", "M602 582c54 8 104 34 158 70", "M596 570c-18 35-23 61-26 88"],
  },
  2: {
    trunk: "M555 590C528 505 542 420 573 354c17-37 38-75 46-128M645 590c27-85 13-170-18-236-17-37-38-75-46-128",
    trunkSegments: [
      "M555 590C528 505 542 420 573 354c17-37 38-75 46-128",
      "M645 590c27-85 13-170-18-236-17-37-38-75-46-128",
    ],
    branches: ["M570 390c-72-28-116-64-146-112", "M630 390c72-28 116-64 146-112", "M575 335c-32-55-72-78-118-99", "M625 335c32-55 72-78 118-99", "M562 448c36-12 73-12 76 0"],
    roots: ["M560 578c-62 18-102 46-150 80", "M640 578c62 18 102 46 150 80", "M566 570c22 20 46 34 69 38"],
  },
  3: {
    trunk: "M600 592c-24-79-2-148-4-218-2-62-20-113-4-172",
    branches: ["M597 416c-82-48-132-93-167-154", "M600 402c82-48 132-93 167-154", "M594 356c-74-8-122-31-163-68", "M602 344c75-8 126-33 170-73", "M597 302c-35-48-46-87-42-126", "M601 291c39-45 52-82 52-119"],
    roots: ["M598 578c-79 22-142 55-201 87", "M602 578c78 22 140 52 199 83", "M596 568c-26 35-36 65-40 91"],
  },
  4: {
    trunk: "M600 592V202",
    branches: ["M600 458H454", "M600 458h146", "M600 388H480", "M600 388h120", "M600 318h-88", "M600 318h88", "M600 248h-58", "M600 248h58"],
    roots: ["M600 580H438", "M600 600H390", "M600 580h162", "M600 600h210"],
  },
  5: {
    trunk: "M574 592c-6-82 34-141 39-212 4-68-39-120 10-191",
    branches: ["M606 430c79-39 150-48 224-31", "M611 382c65-54 133-72 206-68", "M614 326c-44-28-77-54-98-91", "M616 294c58-55 107-75 164-84", "M602 468c-72-11-118-30-158-64"],
    roots: ["M579 580c-86 17-145 43-207 75", "M583 584c84 13 159 39 234 71", "M574 570c-28 31-45 58-55 87"],
  },
  6: {
    trunk: "M600 592c-34-84-7-153-5-224 1-55-19-101 4-155",
    branches: ["M596 438c-94-63-165-79-250-67", "M601 438c94-63 165-79 250-67", "M594 376c-77-52-134-65-205-54", "M602 376c77-52 134-65 205-54", "M596 320c-52-45-85-57-124-56", "M601 320c52-45 85-57 124-56"],
    roots: ["M596 579c-73 25-126 61-164 87", "M604 579c73 25 126 61 164 87", "M598 570c-16 32-20 61-19 89"],
  },
  7: {
    trunk: "M600 592c-19-70 8-129-1-189-8-50-48-88-13-144 18-28 61-23 66 12 6 40-70 56-92 18",
    branches: ["M594 424c-74-29-128-64-164-112", "M605 417c65-22 113-54 150-102", "M587 361c-36-42-50-79-42-113", "M610 354c35-35 49-69 43-100"],
    roots: ["M596 580c-53 25-92 60-125 102", "M604 580c53 25 92 60 125 102", "M598 574c-11 44-8 81 2 119"],
  },
  8: {
    trunk: "M600 592 575 494l34-77-25-71 31-69-12-84",
    branches: ["M591 456 492 398l72-12-50-71", "M604 420 704 357l-77-4 57-81", "M595 349 534 286l54 8-23-81", "M609 285l56-64-48 12 16-85"],
    roots: ["M592 580 476 650l63-11-33 44", "M608 580 724 650l-63-11 33 44", "M600 575v112"],
  },
  9: {
    trunk: "M600 592c-30-78 6-142-4-208-8-58-38-104 3-171",
    branches: ["M596 432c-82-45-143-89-176-145", "M603 432c82-45 143-89 176-145", "M594 372c-62-5-112-27-151-64", "M605 372c62-5 112-27 151-64", "M596 318c-35-44-45-83-37-117", "M602 318c35-44 45-83 37-117"],
    roots: ["M596 580c-70 17-127 48-177 86", "M604 580c70 17 127 48 177 86", "M599 570c-22 39-29 77-24 113", "M601 570c22 39 29 77 24 113"],
  },
};

export interface WorldTreeProps {
  path: PathNumber;
  growth?: number;
  eventCount?: number;
  idPrefix?: string;
  className?: string;
  growthStage?: GrowthStage;
}

export function WorldTree({
  path,
  growth = 0.5,
  eventCount = 0,
  idPrefix = "ninefold-world-tree",
  className = "",
  growthStage = 0,
}: WorldTreeProps) {
  const grammar = getPathGrammar(path);
  const geometry = TREE_GEOMETRY[path];
  const trunkSegments = geometry.trunkSegments ?? [geometry.trunk];
  const maturity = clampUnit(growth);

  return (
    <g
      className={`world-tree world-tree--path-${path} ${className}`.trim()}
      data-path={path}
      data-event-count={eventCount}
      data-silhouette={grammar.silhouette}
      style={{
        "--nf-crown-opacity": 0.62 + maturity * 0.38,
        "--nf-vein-opacity": 0.28 + maturity * 0.44,
      } as CSSProperties}
    >
      <defs>
        <linearGradient id={`${idPrefix}-trunk`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#315f50" />
          <stop offset=".48" stopColor="#548d75" />
          <stop offset=".74" stopColor="#d8e6a2" />
          <stop offset="1" stopColor="#d4d1ff" />
        </linearGradient>
        <radialGradient id={`${idPrefix}-leaf`}>
          <stop offset="0" stopColor="#e9f4b5" stopOpacity=".92" />
          <stop offset=".42" stopColor="#7dbb79" stopOpacity=".9" />
          <stop offset="1" stopColor="#326d65" stopOpacity=".78" />
        </radialGradient>
        <filter id={`${idPrefix}-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g className="world-tree__roots">
        {geometry.roots.map((root, index) => (
          <path
            className="world-tree__root"
            d={root}
            key={root}
            pathLength="1"
            style={{ "--nf-tree-part-delay": `${index * 0.16}s` } as CSSProperties}
          />
        ))}
      </g>
      <g className="world-tree__trunk-shadows">
        {trunkSegments.map((trunk) => (
          <path className="world-tree__trunk-shadow" d={trunk} key={trunk} pathLength="1" />
        ))}
      </g>
      <g className="world-tree__trunks">
        {trunkSegments.map((trunk) => (
          <path
            className="world-tree__trunk"
            d={trunk}
            key={trunk}
            pathLength="1"
            stroke={`url(#${idPrefix}-trunk)`}
          />
        ))}
      </g>
      <g className="world-tree__branches">
        {geometry.branches.map((branch, index) => (
          <path
            className="world-tree__branch"
            d={branch}
            key={branch}
            pathLength="1"
            style={{ "--nf-tree-part-delay": `${index * 0.13}s` } as CSSProperties}
          />
        ))}
      </g>
      <g className="world-tree__crown" fill={`url(#${idPrefix}-leaf)`} filter={`url(#${idPrefix}-glow)`}>
        {renderCrown(path)}
      </g>
      <g className="world-tree__light-veins">
        <path d="M600 566c-8-72 18-135 5-202-10-50 12-98 4-149" />
        <path d="M599 414c-34-19-61-44-77-75" />
        <path d="M604 371c34-17 60-43 77-74" />
      </g>
      <SessionGrowthLayer path={path} stage={growthStage} trunkPath={geometry.trunk} />
    </g>
  );
}

function renderCrown(path: PathNumber): ReactNode {
  switch (path) {
    case 1:
      return <><ellipse cx="600" cy="240" rx="82" ry="142" /><ellipse cx="545" cy="306" rx="62" ry="92" /><ellipse cx="659" cy="302" rx="62" ry="96" /><path d="m600 98 22 60h-44Z" /></>;
    case 2:
      return <><ellipse cx="470" cy="282" rx="120" ry="88" /><ellipse cx="730" cy="282" rx="120" ry="88" /><path d="M470 282Q600 174 730 282Q600 246 470 282Z" /><circle cx="600" cy="266" r="36" /></>;
    case 3:
      return <>{[[600,210],[480,260],[720,256],[430,340],[775,336],[548,322],[660,340]].map(([cx, cy], index) => <g className="world-tree__flower" key={`${cx}-${cy}`} transform={`translate(${cx} ${cy}) rotate(${index * 23})`}><ellipse cx="0" cy="-20" rx="18" ry="34" /><ellipse cx="20" cy="0" rx="34" ry="18" /><ellipse cx="0" cy="20" rx="18" ry="34" /><ellipse cx="-20" cy="0" rx="34" ry="18" /><circle cx="0" cy="0" r="12" /></g>)}</>;
    case 4:
      return <><rect x="478" y="424" width="244" height="40" rx="20" /><rect x="500" y="350" width="200" height="44" rx="18" /><rect x="526" y="276" width="148" height="48" rx="18" /><rect x="552" y="202" width="96" height="52" rx="18" /></>;
    case 5:
      return <><path d="M480 424c154-126 256-114 360-88-104 10-192 46-286 120Z" /><path d="M522 326c116-115 207-110 280-96-81 23-145 58-220 130Z" /><path d="M570 239c80-88 143-84 192-70-56 20-99 50-146 101Z" /></>;
    case 6:
      return <><ellipse cx="600" cy="342" rx="260" ry="120" /><ellipse cx="600" cy="274" rx="204" ry="112" /><ellipse cx="600" cy="220" rx="125" ry="92" /><path className="world-tree__nest" d="M514 380q86 78 172 0-86 45-172 0Z" /></>;
    case 7:
      return <><path d="M600 190c112 0 172 84 134 156-33 63-138 71-202 22-56-43-45-119 8-144 48-24 113 9 106 50-5 31-48 43-76 24 48 7 65-45 30-62-47-24-92 27-72 76 30 72 148 89 222 24 75-66 34-190-130-201Z" /><ellipse cx="600" cy="355" rx="178" ry="58" /></>;
    case 8:
      return <><path d="m600 118 76 126-76 74-76-74Z" /><path d="m488 260 92 18-56 106-100-38Z" /><path d="m712 250 80 92-108 44-50-102Z" /><path d="m600 304 88 120H512Z" /></>;
    case 9:
      return <><circle cx="600" cy="300" r="184" fill="none" stroke="currentColor" strokeWidth="52" strokeDasharray="210 50" /><circle cx="600" cy="300" r="116" /><path d="M600 116a184 184 0 0 1 184 184h-50A134 134 0 0 0 600 166Z" /></>;
  }
}
