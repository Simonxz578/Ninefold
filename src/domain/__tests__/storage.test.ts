import {
  createDailyEntry,
  createNinefoldStorage,
  NINEFOLD_STORAGE_PREFIX,
  STORAGE_KEYS,
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
  id: "storage-profile",
  pathNumber: 4,
  createdAt: "2026-07-01T00:00:00.000Z",
};

const checkIn: DailyCheckIn = {
  energy: 4,
  clarity: 3,
  connection: "balanced",
  focus: "study",
  note: "browser only",
};

describe("versioned Ninefold storage", () => {
  it("persists and validates an original result across storage instances", () => {
    const memory = new MemoryStorage();
    const firstSession = createNinefoldStorage(memory);
    const entry = createDailyEntry(profile, checkIn, "2026-07-13", {
      now: "2026-07-13T08:00:00.000Z",
    });

    expect(firstSession.saveProfile(profile)).toEqual({ ok: true });
    expect(firstSession.saveCheckIn(entry.date, checkIn)).toEqual({ ok: true });
    expect(firstSession.saveEntry(entry)).toEqual({ ok: true });

    const reloadedSession = createNinefoldStorage(memory);
    expect(reloadedSession.readProfile()).toEqual(profile);
    expect(reloadedSession.readCheckIns()[entry.date]).toEqual(checkIn);
    expect(reloadedSession.readEntry(entry.date)).toEqual(entry);
    expect(reloadedSession.getDiagnostics()).toEqual([]);
  });

  it("clears only Ninefold-prefixed keys", () => {
    const memory = new MemoryStorage();
    const storage = createNinefoldStorage(memory);
    memory.setItem("another-app:profile", "keep me");
    memory.setItem(`${NINEFOLD_STORAGE_PREFIX}temporary`, "remove me");
    storage.saveProfile(profile);

    expect(storage.clearAll()).toEqual({ ok: true });
    expect(memory.getItem("another-app:profile")).toBe("keep me");
    expect(memory.getItem(STORAGE_KEYS.profile)).toBeNull();
    expect(memory.getItem(`${NINEFOLD_STORAGE_PREFIX}temporary`)).toBeNull();
  });

  it("handles malformed, invalid and outdated data without throwing", () => {
    const memory = new MemoryStorage();
    memory.setItem(STORAGE_KEYS.profile, "{not-json");
    memory.setItem(
      STORAGE_KEYS.entries,
      JSON.stringify({ schemaVersion: 1, savedAt: "now", data: [{ unsafe: true }] }),
    );
    memory.setItem(
      STORAGE_KEYS.feedback,
      JSON.stringify({ schemaVersion: 0, savedAt: "then", data: [] }),
    );
    memory.setItem("another-app:data", "untouched");
    const storage = createNinefoldStorage(memory);

    expect(() => storage.readProfile()).not.toThrow();
    expect(storage.readProfile()).toBeNull();
    expect(storage.readEntries()).toEqual([]);
    expect(storage.readFeedback()).toEqual([]);
    expect(storage.getDiagnostics().map((item) => item.kind)).toEqual([
      "corrupt",
      "corrupt",
      "outdated",
    ]);
    expect(memory.getItem(STORAGE_KEYS.profile)).toBeNull();
    expect(memory.getItem(STORAGE_KEYS.entries)).toBeNull();
    expect(memory.getItem(STORAGE_KEYS.feedback)).toBeNull();
    expect(memory.getItem("another-app:data")).toBe("untouched");
  });
});
