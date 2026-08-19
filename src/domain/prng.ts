/** FNV-1a turns an arbitrary seed string into a stable unsigned 32-bit value. */
export function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export class SeededRandom {
  private state: number;

  constructor(seed: string) {
    this.state = hashSeed(seed) || 0x6d2b79f5;
  }

  /** Mulberry32: compact, reproducible and sufficient for visual composition. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  }

  integer(minimum: number, maximum: number): number {
    if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || maximum < minimum) {
      throw new RangeError("SeededRandom.integer requires an ordered integer range.");
    }
    return Math.floor(this.next() * (maximum - minimum + 1)) + minimum;
  }

  float(minimum: number, maximum: number): number {
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum < minimum) {
      throw new RangeError("SeededRandom.float requires an ordered finite range.");
    }
    return minimum + this.next() * (maximum - minimum);
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) {
      throw new RangeError("Cannot choose from an empty collection.");
    }
    return values[this.integer(0, values.length - 1)] as T;
  }

  boolean(): boolean {
    return this.next() >= 0.5;
  }
}

export function createSeededPrng(seed: string): SeededRandom {
  return new SeededRandom(seed);
}

export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isLocalDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) return false;
  const date = new Date(year, month - 1, day, 12);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function shiftLocalDate(dateKey: string, offsetDays: number): string {
  if (!isLocalDateKey(dateKey) || !Number.isInteger(offsetDays)) {
    throw new RangeError("shiftLocalDate requires a valid date key and integer offset.");
  }
  const [year, month, day] = dateKey.split("-").map(Number) as [number, number, number];
  return formatLocalDate(new Date(year, month - 1, day + offsetDays, 12));
}
