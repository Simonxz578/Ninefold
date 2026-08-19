import type { PathNumber, PreferenceLenses, Profile, ZodiacSign } from "./types";

let fallbackCounter = 0;

function browserCrypto(): Crypto | undefined {
  try {
    return (globalThis as { crypto?: Crypto }).crypto;
  } catch {
    return undefined;
  }
}

export function createProfileId(): string {
  const cryptoApi = browserCrypto();
  if (cryptoApi?.randomUUID) return `nf-${cryptoApi.randomUUID()}`;
  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    return `nf-${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  fallbackCounter += 1;
  return `nf-${Date.now().toString(36)}-${fallbackCounter.toString(36)}`;
}

export interface CreateProfileInput {
  pathNumber: PathNumber;
  displayName?: string;
  zodiacSign?: ZodiacSign;
  lenses?: PreferenceLenses;
}

export function createProfile(input: CreateProfileInput, now: string = new Date().toISOString()): Profile {
  const displayName = input.displayName?.trim();
  return {
    id: createProfileId(),
    pathNumber: input.pathNumber,
    ...(displayName ? { displayName } : {}),
    ...(input.zodiacSign ? { zodiacSign: input.zodiacSign } : {}),
    ...(input.lenses ? { lenses: { ...input.lenses } } : {}),
    createdAt: now,
  };
}
