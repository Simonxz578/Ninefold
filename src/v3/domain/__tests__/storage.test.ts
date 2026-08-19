import {
  EMPTY_MEDITATION_PROGRESS_V3,
  NINEFOLD_V3_STORAGE_PREFIX,
  V3_LEAF_LAYOUT_VERSION,
  V3_SCHEMA_VERSION,
  V3_STORAGE_KEYS,
  createDailyReadingSemantics,
  createNinefoldV3Storage,
  deriveDailyStateCell,
  derivePersonalityPreferences,
  isDraftWorldIdentity,
  isNinefoldV3State,
  recordCompletedSession,
  type DraftWorldIdentity,
  type NinefoldV3State,
  type V3Profile,
  type V3StorageLike,
} from "../index";

class MemoryStorage implements V3StorageLike {
  private readonly values = new Map<string, string>();
  readonly writes: string[] = [];

  get length(): number {
    return this.values.size;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.writes.push(key);
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const personality = derivePersonalityPreferences({ eOrI: "I", sOrN: "N", tOrF: "F", jOrP: "J" });

const profile: V3Profile = {
  version: V3_SCHEMA_VERSION,
  id: "profile-v3",
  stableSeed: "stable-seed-v3",
  nickname: "Lin",
  birthMonth: 8,
  birthDay: 30,
  zodiacSign: "virgo",
  cloudArchetype: "high-veils",
  worldPrototype: 7,
  personality,
  createdAt: "2026-08-19T07:00:00.000Z",
  preferredAmbientMode: "ocean",
};

function makeState(): NinefoldV3State {
  const semanticReading = createDailyReadingSemantics({
    localDate: "2026-08-19",
    stableSeed: profile.stableSeed,
    zodiacSign: profile.zodiacSign,
    personality,
    mood: 4,
    energy: 7,
  });
  const meditation = recordCompletedSession(
    { ...EMPTY_MEDITATION_PROGRESS_V3, sessions: [] },
    {
      sessionId: "session-v3-1",
      localDate: "2026-08-19",
      durationSeconds: 60,
      ambientMode: "ocean",
      startedAt: "2026-08-19T08:00:00.000Z",
      completedAt: "2026-08-19T08:01:00.000Z",
    },
  );
  return {
    version: V3_SCHEMA_VERSION,
    profile,
    world: {
      profileId: profile.id,
      bareTreeBorn: true,
      bornAt: "2026-08-19T07:30:00.000Z",
      leafLayoutVersion: V3_LEAF_LAYOUT_VERSION,
    },
    checkIns: {
      "2026-08-19": {
        localDate: "2026-08-19",
        mood: 4,
        energy: 7,
        derivedStateCell: deriveDailyStateCell(4, 7),
        semanticReading,
        updatedAt: "2026-08-19T07:45:00.000Z",
      },
    },
    meditation,
  };
}

const draft: DraftWorldIdentity = {
  version: V3_SCHEMA_VERSION,
  stableSeed: "draft-seed",
  stage: "cloud",
  birthMonth: 2,
  birthDay: 29,
  zodiacSign: "pisces",
  bareTreeBorn: false,
  preferredAmbientMode: "rain",
  updatedAt: "2026-08-19T06:00:00.000Z",
};

describe("Ninefold V3 atomic storage", () => {
  it("round-trips one validated atomic state and keeps the builder draft separate", () => {
    const memory = new MemoryStorage();
    const storage = createNinefoldV3Storage(memory);
    const state = makeState();

    expect(storage.saveState(state)).toEqual({ ok: true });
    expect(storage.saveDraft(draft)).toEqual({ ok: true });
    expect(storage.saveLocale("zh-CN")).toEqual({ ok: true });
    expect(createNinefoldV3Storage(memory).readState()).toEqual(state);
    expect(createNinefoldV3Storage(memory).readDraft()).toEqual(draft);
    expect(createNinefoldV3Storage(memory).readLocale()).toBe("zh-CN");
    expect(memory.writes.every((key) => key.startsWith(NINEFOLD_V3_STORAGE_PREFIX))).toBe(true);

    expect(storage.removeDraft()).toEqual({ ok: true });
    expect(storage.readDraft()).toBeNull();
    expect(storage.readState()).toEqual(state);
  });

  it("clears only V3-owned keys and preserves V1, V2, and unrelated values", () => {
    const memory = new MemoryStorage();
    const storage = createNinefoldV3Storage(memory);
    memory.setItem("ninefold:v1:profile", "legacy-v1");
    memory.setItem("ninefold:v2:profile", "stable-v2");
    memory.setItem("another-app:data", "keep");
    memory.setItem(`${NINEFOLD_V3_STORAGE_PREFIX}future-key`, "remove");
    expect(storage.saveState(makeState())).toEqual({ ok: true });
    expect(storage.saveDraft(draft)).toEqual({ ok: true });

    expect(storage.clearAll()).toEqual({ ok: true });
    expect(memory.getItem("ninefold:v1:profile")).toBe("legacy-v1");
    expect(memory.getItem("ninefold:v2:profile")).toBe("stable-v2");
    expect(memory.getItem("another-app:data")).toBe("keep");
    expect(memory.getItem(V3_STORAGE_KEYS.state)).toBeNull();
    expect(memory.getItem(V3_STORAGE_KEYS.draft)).toBeNull();
    expect(memory.getItem(`${NINEFOLD_V3_STORAGE_PREFIX}future-key`)).toBeNull();
  });

  it("rejects inconsistent profile, reading, world, and meditation data", () => {
    const state = makeState();
    expect(isNinefoldV3State(state)).toBe(true);
    expect(isNinefoldV3State({
      ...state,
      profile: { ...state.profile, zodiacSign: "leo" },
    })).toBe(false);
    expect(isNinefoldV3State({
      ...state,
      world: { ...state.world, profileId: "different-profile" },
    })).toBe(false);
    expect(isNinefoldV3State({
      ...state,
      checkIns: {
        ...state.checkIns,
        "2026-08-19": { ...state.checkIns["2026-08-19"], derivedStateCell: "low-low" },
      },
    })).toBe(false);
    expect(isNinefoldV3State({
      ...state,
      meditation: { ...state.meditation, leafCount: 2 },
    })).toBe(false);
    expect(isNinefoldV3State({
      ...state,
      checkIns: {
        "2026-08-19": {
          ...state.checkIns["2026-08-19"],
          semanticReading: {
            ...state.checkIns["2026-08-19"]!.semanticReading,
            keywordId: state.checkIns["2026-08-19"]!.semanticReading.keywordId === "focus"
              ? "balance"
              : "focus",
          },
        },
      },
    })).toBe(false);
    expect(isNinefoldV3State({
      ...state,
      meditation: {
        ...state.meditation,
        sessions: state.meditation.sessions.map((session) => ({
          ...session,
          completedAt: session.startedAt,
        })),
        lastCompletedAt: state.meditation.sessions[0]!.startedAt,
      },
    })).toBe(false);
  });

  it("fails corrupt state safely and removes only its own corrupt key", () => {
    const memory = new MemoryStorage();
    const corrupt = {
      ...makeState(),
      profile: { ...profile, personality: { ...personality, code: "ENTP" } },
    };
    memory.setItem(V3_STORAGE_KEYS.state, JSON.stringify({
      schemaVersion: V3_SCHEMA_VERSION,
      savedAt: "2026-08-19T09:00:00.000Z",
      data: corrupt,
    }));
    memory.setItem("ninefold:v2:profile", "preserve");
    const storage = createNinefoldV3Storage(memory);

    expect(storage.readState()).toBeNull();
    expect(memory.getItem(V3_STORAGE_KEYS.state)).toBeNull();
    expect(memory.getItem("ninefold:v2:profile")).toBe("preserve");
    expect(storage.getDiagnostics()).toContainEqual(expect.objectContaining({
      key: V3_STORAGE_KEYS.state,
      kind: "corrupt",
    }));
  });

  it("accepts a coherent resumable draft but rejects half-dates and incomplete born worlds", () => {
    expect(isDraftWorldIdentity(draft)).toBe(true);
    expect(isDraftWorldIdentity({ ...draft, birthDay: undefined, zodiacSign: undefined })).toBe(false);
    expect(isDraftWorldIdentity({ ...draft, bareTreeBorn: true })).toBe(false);
    expect(isDraftWorldIdentity({
      ...draft,
      stage: "nickname",
      bareTreeBorn: true,
      cloudArchetype: "soft-cumulus",
      worldPrototype: 4,
    })).toBe(true);
    expect(isDraftWorldIdentity({
      version: V3_SCHEMA_VERSION,
      stableSeed: "stranded",
      stage: "personality",
      bareTreeBorn: false,
      preferredAmbientMode: "ocean",
      updatedAt: "2026-08-19T06:00:00.000Z",
    })).toBe(false);
    expect(isDraftWorldIdentity({
      ...draft,
      stage: "world",
    })).toBe(false);
  });
});
