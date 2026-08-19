export function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Stable, renderer-only variation. Product state remains the source of truth. */
export function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededUnit(seed: string, salt: string): number {
  return stableHash(`${seed}:${salt}`) / 0xffffffff;
}

export function sanitiseSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}
