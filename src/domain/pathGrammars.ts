import { PATH_NUMBERS } from "./types";
import type { PathGrammar, PathNumber } from "./types";

const GRAMMARS = {
  1: {
    pathNumber: 1,
    name: { en: "Initiation", zh: "启程" },
    silhouette: "ascending-spire",
    branchPattern: "single-leading",
    rootPattern: "forward-path",
    biome: "sunlit-meadow",
    symmetry: "bilateral",
    orientation: "ascending",
    growthFeatures: ["trunk", "branch", "path"],
    sigilMergeTargets: ["branch-node", "root-mark"],
  },
  2: {
    pathNumber: 2,
    name: { en: "Connection", zh: "联结" },
    silhouette: "paired-arc",
    branchPattern: "paired-bridging",
    rootPattern: "linked-pairs",
    biome: "converging-streams",
    symmetry: "bilateral",
    orientation: "balanced",
    growthFeatures: ["branch", "bridge", "stream"],
    sigilMergeTargets: ["bridge-motif", "branch-node"],
  },
  3: {
    pathNumber: 3,
    name: { en: "Expression", zh: "表达" },
    silhouette: "flowering-radiance",
    branchPattern: "petal-radiating",
    rootPattern: "seed-scatter",
    biome: "flowering-field",
    symmetry: "asymmetric",
    orientation: "outward",
    growthFeatures: ["flower", "leaf", "branch"],
    sigilMergeTargets: ["flower", "constellation"],
  },
  4: {
    pathNumber: 4,
    name: { en: "Structure", zh: "构筑" },
    silhouette: "tiered-terrace",
    branchPattern: "modular-tiered",
    rootPattern: "geometric-terraces",
    biome: "terraced-garden",
    symmetry: "bilateral",
    orientation: "balanced",
    growthFeatures: ["terrace", "root", "branch"],
    sigilMergeTargets: ["root-mark", "bridge-motif"],
  },
  5: {
    pathNumber: 5,
    name: { en: "Movement", zh: "流动" },
    silhouette: "wind-swept-flow",
    branchPattern: "forking-ribbons",
    rootPattern: "stream-delta",
    biome: "wind-and-water",
    symmetry: "asymmetric",
    orientation: "rotating",
    growthFeatures: ["stream", "path", "branch"],
    sigilMergeTargets: ["water-mark", "branch-node"],
  },
  6: {
    pathNumber: 6,
    name: { en: "Care", zh: "养护" },
    silhouette: "sheltering-canopy",
    branchPattern: "enclosing-nested",
    rootPattern: "soft-enclosure",
    biome: "sheltered-grove",
    symmetry: "radial",
    orientation: "inward",
    growthFeatures: ["canopy", "nest", "fruit", "pool"],
    sigilMergeTargets: ["fruit", "root-mark"],
  },
  7: {
    pathNumber: 7,
    name: { en: "Reflection", zh: "沉思" },
    silhouette: "mirrored-depth",
    branchPattern: "inward-spiral",
    rootPattern: "submerged-depth",
    biome: "reflective-lake",
    symmetry: "rotational",
    orientation: "inward",
    growthFeatures: ["reflection", "root", "star", "pool"],
    sigilMergeTargets: ["water-mark", "constellation"],
  },
  8: {
    pathNumber: 8,
    name: { en: "Realisation", zh: "凝成" },
    silhouette: "crystalline-ascent",
    branchPattern: "faceted-nodes",
    rootPattern: "mountain-foundation",
    biome: "crystal-highland",
    symmetry: "bilateral",
    orientation: "ascending",
    growthFeatures: ["crystal", "fruit", "branch"],
    sigilMergeTargets: ["crystal-face", "branch-node"],
  },
  9: {
    pathNumber: 9,
    name: { en: "Integration", zh: "归一" },
    silhouette: "seasonal-circle",
    branchPattern: "cyclical-integrated",
    rootPattern: "renewal-ring",
    biome: "integrated-seasons",
    symmetry: "radial",
    orientation: "balanced",
    growthFeatures: ["seasonal-ring", "nebula", "flower", "root"],
    sigilMergeTargets: ["seasonal-ring", "nebula-node"],
  },
} as const satisfies Record<PathNumber, PathGrammar>;

export const PATH_GRAMMARS: Readonly<Record<PathNumber, PathGrammar>> = GRAMMARS;

export function getPathGrammar(pathNumber: PathNumber): PathGrammar {
  if (!PATH_NUMBERS.includes(pathNumber)) {
    throw new RangeError("Path number must be 1–9.");
  }
  return PATH_GRAMMARS[pathNumber];
}

export function listPathGrammars(): PathGrammar[] {
  return PATH_NUMBERS.map(getPathGrammar);
}

/** A stable renderer-facing signature useful for audits and snapshot tests. */
export function getPathGrammarSignature(pathNumber: PathNumber): string {
  const grammar = getPathGrammar(pathNumber);
  return [
    grammar.silhouette,
    grammar.branchPattern,
    grammar.rootPattern,
    grammar.biome,
    grammar.symmetry,
    grammar.orientation,
  ].join("|");
}
