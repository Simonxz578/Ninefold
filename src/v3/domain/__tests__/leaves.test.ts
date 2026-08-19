import {
  EMPTY_MEDITATION_PROGRESS_V3,
  getLeafPlacement,
  getLeafPlacements,
  recordCompletedSession,
} from "../index";

describe("V3 breathing-session leaves", () => {
  it("keeps placements deterministic and prefix-stable as the tree grows", () => {
    const firstTen = getLeafPlacements("stable-profile", 7, 10);
    const firstTwenty = getLeafPlacements("stable-profile", 7, 20);

    expect(firstTwenty.slice(0, 10)).toEqual(firstTen);
    expect(getLeafPlacement("stable-profile", 7, 3)).toEqual(firstTen[3]);
    expect(getLeafPlacements("another-profile", 7, 10)).not.toEqual(firstTen);
    expect(getLeafPlacements("stable-profile", 8, 10)).not.toEqual(firstTen);
    expect(firstTwenty.every((leaf) => Math.hypot(leaf.x - leaf.anchorX, leaf.y - leaf.anchorY) <= 24.01)).toBe(true);
  });

  it("adds exactly one leaf for either allowed duration and permits two on one day", () => {
    const initial = { ...EMPTY_MEDITATION_PROGRESS_V3, sessions: [] };
    const first = recordCompletedSession(initial, {
      sessionId: "session-1",
      localDate: "2026-08-19",
      durationSeconds: 60,
      ambientMode: "ocean",
      startedAt: "2026-08-19T08:00:00.000Z",
      completedAt: "2026-08-19T08:01:00.000Z",
    });
    const second = recordCompletedSession(first, {
      sessionId: "session-2",
      localDate: "2026-08-19",
      durationSeconds: 300,
      ambientMode: "rain",
      startedAt: "2026-08-19T09:00:00.000Z",
      completedAt: "2026-08-19T09:05:00.000Z",
    });

    expect(initial).toMatchObject({ totalCompletedSessions: 0, totalCompletedSeconds: 0, leafCount: 0 });
    expect(first).toMatchObject({ totalCompletedSessions: 1, totalCompletedSeconds: 60, leafCount: 1 });
    expect(first.sessions[0]?.leafIndex).toBe(0);
    expect(second).toMatchObject({ totalCompletedSessions: 2, totalCompletedSeconds: 360, leafCount: 2 });
    expect(second.sessions[1]?.leafIndex).toBe(1);
  });

  it("is idempotent by session ID and cannot award a 30-second/aborted session", () => {
    const initial = { ...EMPTY_MEDITATION_PROGRESS_V3, sessions: [] };
    const completion = {
      sessionId: "same-session",
      localDate: "2026-08-19",
      durationSeconds: 60 as const,
      ambientMode: "ocean" as const,
      startedAt: "2026-08-19T08:00:00.000Z",
      completedAt: "2026-08-19T08:01:00.000Z",
    };
    const once = recordCompletedSession(initial, completion);
    expect(recordCompletedSession(once, completion)).toBe(once);
    expect(() => recordCompletedSession(initial, { ...completion, sessionId: "short", durationSeconds: 30 as 60 }))
      .toThrow(RangeError);
    expect(initial.leafCount).toBe(0);
  });
});
