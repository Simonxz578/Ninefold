import {
  DEFAULT_REST_SESSION_PROGRESS,
  advanceRestSession,
  isRestSessionProgress,
  updateRestAudioPreferences,
} from "../index";

describe("Rest-session progress", () => {
  it("starts without growth and at a restrained default volume", () => {
    expect(DEFAULT_REST_SESSION_PROGRESS).toEqual({
      completedSessions: 0,
      totalCompletedSeconds: 0,
      growthStage: 0,
      audioMuted: false,
      audioVolume: 0.3,
    });
    expect(isRestSessionProgress(DEFAULT_REST_SESSION_PROGRESS)).toBe(true);
  });

  it("defensively rejects partial, non-finite and out-of-range progress", () => {
    expect(isRestSessionProgress(null)).toBe(false);
    expect(isRestSessionProgress({ ...DEFAULT_REST_SESSION_PROGRESS, audioMuted: "false" })).toBe(false);
    expect(isRestSessionProgress({ ...DEFAULT_REST_SESSION_PROGRESS, growthStage: 6 })).toBe(false);
    expect(isRestSessionProgress({ ...DEFAULT_REST_SESSION_PROGRESS, audioVolume: Number.NaN })).toBe(false);
    expect(isRestSessionProgress({ ...DEFAULT_REST_SESSION_PROGRESS, totalCompletedSeconds: 1.5 })).toBe(false);
  });

  it("records 30-, 60-, and 300-second completions without mutating its input", () => {
    const initial = { ...DEFAULT_REST_SESSION_PROGRESS };
    const first = advanceRestSession(initial, 30);
    const second = advanceRestSession(first, 60, "2026-08-04T08:00:00.000Z");
    const third = advanceRestSession(second, 300);

    expect(initial).toEqual(DEFAULT_REST_SESSION_PROGRESS);
    expect(first).toMatchObject({ completedSessions: 1, totalCompletedSeconds: 30, growthStage: 1 });
    expect(second).toMatchObject({
      completedSessions: 2,
      totalCompletedSeconds: 90,
      growthStage: 2,
      lastCompletedAt: "2026-08-04T08:00:00.000Z",
    });
    expect(third).toMatchObject({
      completedSessions: 3,
      totalCompletedSeconds: 390,
      growthStage: 3,
    });
  });

  it("continues recording completed sessions while capping visual growth at stage five", () => {
    const mature = {
      ...DEFAULT_REST_SESSION_PROGRESS,
      completedSessions: 8,
      totalCompletedSeconds: 300,
      growthStage: 5 as const,
    };

    expect(advanceRestSession(mature, 60)).toMatchObject({
      completedSessions: 9,
      totalCompletedSeconds: 360,
      growthStage: 5,
    });
    expect(() => advanceRestSession(mature, 45 as 30)).toThrow(RangeError);
  });

  it("updates only valid local audio preferences", () => {
    const initial = { ...DEFAULT_REST_SESSION_PROGRESS, growthStage: 2 as const };
    expect(updateRestAudioPreferences(initial, { audioMuted: true, audioVolume: 0.65 })).toEqual({
      ...initial,
      audioMuted: true,
      audioVolume: 0.65,
    });
    expect(initial).toMatchObject({ audioMuted: false, audioVolume: 0.3 });
    expect(() => updateRestAudioPreferences(initial, { audioVolume: 1.1 })).toThrow(RangeError);
  });
});
