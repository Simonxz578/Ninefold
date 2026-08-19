import {
  createDailyEntry,
  createGrowthEventFromDailyEntry,
  createNinefoldStorage,
  createNinefoldV2Storage,
  DEFAULT_REST_SESSION_PROGRESS,
  NINEFOLD_V1_STORAGE_PREFIX,
  NINEFOLD_V2_STORAGE_PREFIX,
  reframeDailyEntry,
  V2_STORAGE_KEYS,
} from "../index";
import type { DailyCheckIn, Profile, StorageLike } from "../index";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

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
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const profile: Profile = {
  id: "v2-storage-profile",
  displayName: "Lin",
  pathNumber: 7,
  createdAt: "2026-07-01T00:00:00.000Z",
};

const checkIn: DailyCheckIn = {
  energy: 4,
  clarity: 2,
  connection: "inward",
  focus: "creativity",
  note: "private and local",
};

describe("Ninefold V2 storage and migration", () => {
  it("migrates V1 profile, date and Reframe once without deleting legacy data", () => {
    const memory = new MemoryStorage();
    const legacy = createNinefoldStorage(memory);
    const original = createDailyEntry(profile, checkIn, "2026-07-13", {
      now: "2026-07-13T08:00:00.000Z",
    });
    const reframed = reframeDailyEntry(original, profile, []);
    expect(reframed.ok).toBe(true);
    if (!reframed.ok) return;
    legacy.saveProfile(profile);
    legacy.saveCheckIn(original.date, checkIn);
    legacy.saveEntry(reframed.entry);

    const firstV2 = createNinefoldV2Storage(memory);
    expect(firstV2.readProfile()).toEqual(profile);
    expect(firstV2.readEntries()).toHaveLength(1);
    expect(firstV2.readEntries()[0]?.date).toBe("2026-07-13");
    expect(firstV2.readEntries()[0]?.reframeUsed).toBe(true);
    expect(firstV2.readLandscape()?.events).toHaveLength(1);
    expect(firstV2.readLandscape()?.events[0]?.reframe).toBeDefined();
    expect(firstV2.readMigrationMarker()?.migratedDates).toEqual(["2026-07-13"]);

    const secondV2 = createNinefoldV2Storage(memory);
    expect(secondV2.readLandscape()?.events).toHaveLength(1);
    expect(memory.getItem(`${NINEFOLD_V1_STORAGE_PREFIX}profile`)).not.toBeNull();
  });

  it("persists a user care action and locale as one idempotent GrowthEvent", () => {
    const memory = new MemoryStorage();
    const storage = createNinefoldV2Storage(memory);
    const entry = createDailyEntry(profile, checkIn, "2026-07-14", {
      now: "2026-07-14T08:00:00.000Z",
    });
    const event = createGrowthEventFromDailyEntry(entry, {
      careAction: "protect",
      localeAtCreation: "zh-CN",
      timeOfDay: "morning",
    });

    expect(storage.saveProfile(profile)).toEqual({ ok: true });
    expect(storage.saveEntry(entry)).toEqual({ ok: true });
    expect(storage.saveGrowthEvent(profile, event, "zh-CN")).toEqual({ ok: true });
    expect(storage.saveGrowthEvent(profile, event, "zh-CN")).toEqual({ ok: true });

    const landscape = storage.readLandscape();
    expect(landscape?.events).toHaveLength(1);
    expect(landscape?.events[0]).toMatchObject({
      careAction: "protect",
      localeAtCreation: "zh-CN",
      date: "2026-07-14",
    });
    expect(landscape?.currentLocale).toBe("zh-CN");
  });

  it("clears only Ninefold V1 and V2 keys", () => {
    const memory = new MemoryStorage();
    const storage = createNinefoldV2Storage(memory);
    memory.setItem("another-app:data", "keep");
    memory.setItem(`${NINEFOLD_V1_STORAGE_PREFIX}temporary`, "legacy");
    memory.setItem(`${NINEFOLD_V2_STORAGE_PREFIX}temporary`, "current");
    storage.saveProfile(profile);
    storage.saveRestSessionProgress({
      ...DEFAULT_REST_SESSION_PROGRESS,
      completedSessions: 1,
      totalCompletedSeconds: 60,
      growthStage: 1,
    });

    expect(storage.clearAll()).toEqual({ ok: true });
    expect(memory.getItem("another-app:data")).toBe("keep");
    expect(memory.getItem(`${NINEFOLD_V1_STORAGE_PREFIX}temporary`)).toBeNull();
    expect(memory.getItem(`${NINEFOLD_V2_STORAGE_PREFIX}temporary`)).toBeNull();
    expect(memory.getItem(V2_STORAGE_KEYS.profile)).toBeNull();
    expect(memory.getItem(V2_STORAGE_KEYS.restSession)).toBeNull();
  });

  it("persists valid Rest-session progress and reloads it from a V2 envelope", () => {
    const memory = new MemoryStorage();
    const firstSession = createNinefoldV2Storage(memory);
    const progress = {
      ...DEFAULT_REST_SESSION_PROGRESS,
      completedSessions: 3,
      totalCompletedSeconds: 150,
      growthStage: 3 as const,
      audioMuted: true,
      audioVolume: 0.55,
      lastCompletedAt: "2026-08-04T08:00:00.000Z",
    };

    expect(firstSession.readRestSessionProgress()).toEqual(DEFAULT_REST_SESSION_PROGRESS);
    expect(firstSession.saveRestSessionProgress(progress)).toEqual({ ok: true });
    expect(createNinefoldV2Storage(memory).readRestSessionProgress()).toEqual(progress);
  });

  it("falls back safely and removes corrupt Rest-session progress", () => {
    const memory = new MemoryStorage();
    memory.setItem(V2_STORAGE_KEYS.restSession, JSON.stringify({
      schemaVersion: 2,
      savedAt: "2026-08-04T00:00:00.000Z",
      data: { ...DEFAULT_REST_SESSION_PROGRESS, growthStage: 9 },
    }));
    memory.setItem("another-app:data", "keep");
    const storage = createNinefoldV2Storage(memory);

    expect(storage.readRestSessionProgress()).toEqual(DEFAULT_REST_SESSION_PROGRESS);
    expect(storage.getDiagnostics()).toContainEqual(expect.objectContaining({
      key: V2_STORAGE_KEYS.restSession,
      kind: "corrupt",
    }));
    expect(memory.getItem(V2_STORAGE_KEYS.restSession)).toBeNull();
    expect(memory.getItem("another-app:data")).toBe("keep");
  });

  it("repairs corrupt V2 data without touching unrelated storage", () => {
    const memory = new MemoryStorage();
    memory.setItem(V2_STORAGE_KEYS.landscape, "{broken");
    memory.setItem("another-app:data", "keep");
    const storage = createNinefoldV2Storage(memory);

    expect(storage.readLandscape()).toBeNull();
    expect(storage.getDiagnostics().some((item) => item.kind === "corrupt")).toBe(true);
    expect(memory.getItem(V2_STORAGE_KEYS.landscape)).toBeNull();
    expect(memory.getItem("another-app:data")).toBe("keep");
  });
});
