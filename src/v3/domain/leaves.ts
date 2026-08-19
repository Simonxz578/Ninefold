import { createSeededPrng, isLocalDateKey } from "../../domain/prng";
import { PATH_NUMBERS, type PathNumber } from "../../domain/types";
import { AMBIENT_MODES, type CompletedSessionV3, type MeditationProgressV3 } from "./types";
import type { AmbientMode, BreathingDurationSeconds } from "./types";

interface LeafCluster {
  x: number;
  y: number;
  rotation: number;
}

const LEAF_CLUSTERS: Readonly<Record<PathNumber, readonly LeafCluster[]>> = {
  1: [{ x: 502, y: 302, rotation: -48 }, { x: 678, y: 249, rotation: 45 }, { x: 557, y: 204, rotation: -24 }, { x: 633, y: 167, rotation: 25 }, { x: 545, y: 306, rotation: -55 }, { x: 659, y: 302, rotation: 52 }],
  2: [{ x: 424, y: 278, rotation: -58 }, { x: 776, y: 278, rotation: 58 }, { x: 457, y: 236, rotation: -42 }, { x: 743, y: 236, rotation: 42 }, { x: 600, y: 448, rotation: 0 }, { x: 470, y: 282, rotation: -72 }, { x: 730, y: 282, rotation: 72 }],
  3: [{ x: 430, y: 262, rotation: -62 }, { x: 767, y: 248, rotation: 61 }, { x: 431, y: 288, rotation: -45 }, { x: 772, y: 271, rotation: 48 }, { x: 555, y: 176, rotation: -18 }, { x: 653, y: 172, rotation: 20 }, { x: 548, y: 322, rotation: -38 }, { x: 660, y: 340, rotation: 40 }],
  4: [{ x: 454, y: 458, rotation: -82 }, { x: 746, y: 458, rotation: 82 }, { x: 480, y: 388, rotation: -76 }, { x: 720, y: 388, rotation: 76 }, { x: 512, y: 318, rotation: -68 }, { x: 688, y: 318, rotation: 68 }, { x: 542, y: 248, rotation: -58 }, { x: 658, y: 248, rotation: 58 }],
  5: [{ x: 830, y: 399, rotation: 78 }, { x: 817, y: 314, rotation: 66 }, { x: 516, y: 235, rotation: -44 }, { x: 780, y: 210, rotation: 58 }, { x: 444, y: 404, rotation: -68 }, { x: 554, y: 456, rotation: -40 }, { x: 706, y: 357, rotation: 48 }],
  6: [{ x: 346, y: 371, rotation: -78 }, { x: 851, y: 371, rotation: 78 }, { x: 389, y: 322, rotation: -64 }, { x: 807, y: 322, rotation: 64 }, { x: 472, y: 264, rotation: -48 }, { x: 725, y: 264, rotation: 48 }, { x: 514, y: 380, rotation: -32 }, { x: 686, y: 380, rotation: 32 }],
  7: [{ x: 430, y: 312, rotation: -62 }, { x: 755, y: 315, rotation: 59 }, { x: 545, y: 248, rotation: -28 }, { x: 653, y: 254, rotation: 30 }, { x: 532, y: 368, rotation: -40 }, { x: 700, y: 336, rotation: 42 }, { x: 600, y: 190, rotation: 0 }],
  8: [{ x: 492, y: 398, rotation: -66 }, { x: 704, y: 357, rotation: 62 }, { x: 534, y: 286, rotation: -46 }, { x: 665, y: 221, rotation: 46 }, { x: 575, y: 244, rotation: -22 }, { x: 633, y: 148, rotation: 22 }, { x: 512, y: 424, rotation: -52 }, { x: 688, y: 424, rotation: 52 }],
  9: [{ x: 420, y: 287, rotation: -64 }, { x: 779, y: 287, rotation: 64 }, { x: 443, y: 308, rotation: -52 }, { x: 757, y: 308, rotation: 52 }, { x: 559, y: 201, rotation: -24 }, { x: 637, y: 201, rotation: 24 }, { x: 516, y: 372, rotation: -38 }, { x: 684, y: 372, rotation: 38 }],
};

export interface LeafPlacement {
  index: number;
  clusterIndex: number;
  anchorX: number;
  anchorY: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface CompletedSessionInputV3 {
  sessionId: string;
  localDate: string;
  durationSeconds: BreathingDurationSeconds;
  ambientMode: AmbientMode;
  startedAt: string;
  completedAt: string;
}

export const EMPTY_MEDITATION_PROGRESS_V3: Readonly<MeditationProgressV3> = {
  totalCompletedSessions: 0,
  totalCompletedSeconds: 0,
  leafCount: 0,
  sessions: [],
  audioMuted: false,
  audioVolume: 0.3,
};

/** Placement depends only on permanent identity, Path and zero-based leaf index. */
export function getLeafPlacement(
  stableSeed: string,
  path: PathNumber,
  leafIndex: number,
): LeafPlacement {
  if (stableSeed.trim().length === 0) throw new TypeError("A stable profile seed is required.");
  if (!PATH_NUMBERS.some((candidate) => candidate === path)) throw new RangeError("Path must be 1–9.");
  if (!Number.isInteger(leafIndex) || leafIndex < 0) throw new RangeError("Leaf index must be non-negative.");

  const clusters = LEAF_CLUSTERS[path];
  const order = shuffledClusterOrder(clusters.length, `${stableSeed}|${path}|cluster-order`);
  const clusterIndex = order[leafIndex % order.length] ?? 0;
  const cluster = clusters[clusterIndex] ?? clusters[0];
  if (!cluster) throw new RangeError("The selected Path has no leaf anchors.");

  const tier = Math.floor(leafIndex / clusters.length);
  const random = createSeededPrng(JSON.stringify(["ninefold-v3-leaf-v1", stableSeed, path, leafIndex]));
  const angle = random.float(0, Math.PI * 2);
  const radius = Math.min(24, 3 + tier * 2.35) * Math.sqrt(random.next());
  const x = cluster.x + Math.cos(angle) * radius;
  const y = cluster.y + Math.sin(angle) * radius * 0.72;

  return {
    index: leafIndex,
    clusterIndex,
    anchorX: cluster.x,
    anchorY: cluster.y,
    x: round(x),
    y: round(y),
    rotation: round(cluster.rotation + random.float(-18, 18), 1),
    scale: round(Math.max(0.36, 0.66 - Math.min(tier, 10) * 0.018 + random.float(-0.055, 0.055)), 3),
  };
}

export function getLeafPlacements(
  stableSeed: string,
  path: PathNumber,
  leafCount: number,
): LeafPlacement[] {
  if (!Number.isInteger(leafCount) || leafCount < 0) throw new RangeError("Leaf count must be non-negative.");
  return Array.from({ length: leafCount }, (_, index) => getLeafPlacement(stableSeed, path, index));
}

/** Idempotently records one completed 1- or 5-minute session and therefore one leaf. */
export function recordCompletedSession(
  progress: MeditationProgressV3,
  input: CompletedSessionInputV3,
): MeditationProgressV3 {
  assertProgressInvariants(progress);
  if (progress.sessions.some((session) => session.sessionId === input.sessionId)) return progress;
  if (input.sessionId.trim().length === 0) throw new TypeError("A session ID is required.");
  if (!isLocalDateKey(input.localDate)) throw new RangeError("Session date must be local YYYY-MM-DD.");
  if (input.durationSeconds !== 60 && input.durationSeconds !== 300) {
    throw new RangeError("Breathing sessions must last 60 or 300 seconds.");
  }
  if (!AMBIENT_MODES.some((mode) => mode === input.ambientMode)) throw new TypeError("Ambient mode is invalid.");
  if (!isIsoInstant(input.startedAt) || !isIsoInstant(input.completedAt)) throw new TypeError("Session times must be ISO instants.");
  if (Date.parse(input.completedAt) < Date.parse(input.startedAt)) throw new RangeError("Completion cannot precede session start.");

  const session: CompletedSessionV3 = {
    ...input,
    leafIndex: progress.leafCount,
  };
  const sessions = [...progress.sessions, session];
  return {
    ...progress,
    sessions,
    totalCompletedSessions: progress.totalCompletedSessions + 1,
    totalCompletedSeconds: progress.totalCompletedSeconds + input.durationSeconds,
    leafCount: progress.leafCount + 1,
    lastCompletedAt: input.completedAt,
  };
}

function shuffledClusterOrder(length: number, seed: string): number[] {
  const values = Array.from({ length }, (_, index) => index);
  const random = createSeededPrng(seed);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const selected = random.integer(0, index);
    [values[index], values[selected]] = [values[selected] as number, values[index] as number];
  }
  return values;
}

function assertProgressInvariants(progress: MeditationProgressV3): void {
  const count = progress.sessions.length;
  const seconds = progress.sessions.reduce((total, session) => total + session.durationSeconds, 0);
  if (progress.totalCompletedSessions !== count || progress.leafCount !== count || progress.totalCompletedSeconds !== seconds) {
    throw new TypeError("Meditation progress aggregates are inconsistent.");
  }
}

function isIsoInstant(value: string): boolean {
  return value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
