import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { App } from "../App";
import { ScrollToTop } from "../components/ScrollToTop";
import {
  NINEFOLD_V1_STORAGE_PREFIX,
  NINEFOLD_V2_STORAGE_PREFIX,
} from "../domain/v2Storage";
import { localDateKey } from "../utils/date";
import {
  EMPTY_MEDITATION_PROGRESS_V3,
  NINEFOLD_V3_STORAGE_PREFIX,
  V3_LEAF_LAYOUT_VERSION,
  V3_SCHEMA_VERSION,
  V3_STORAGE_KEYS,
  createDailyReadingSemantics,
  derivePersonalityPreferences,
  deriveZodiacSign,
  ninefoldV3Storage,
  recordCompletedSession,
  type DraftWorldIdentity,
  type NinefoldV3State,
} from "../v3/domain";

const FIXED_STABLE_SEED = "v3-smoke-stable-seed";
const TEST_SENTINEL_PREFIX = "another-product:ninefold-smoke:";

function RouteProbe() {
  const location = useLocation();
  return (
    <output data-testid="current-route">
      {`${location.pathname}${location.search}${location.hash}`}
    </output>
  );
}

function renderApp(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ScrollToTop />
      <App />
      <RouteProbe />
    </MemoryRouter>,
  );
}

function ownedTestStorageKeys(): string[] {
  return Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
    .filter((key): key is string => Boolean(
      key?.startsWith(NINEFOLD_V1_STORAGE_PREFIX)
      || key?.startsWith(NINEFOLD_V2_STORAGE_PREFIX)
      || key?.startsWith(NINEFOLD_V3_STORAGE_PREFIX)
      || key?.startsWith(TEST_SENTINEL_PREFIX),
    ));
}

function clearTestStorage(): void {
  ownedTestStorageKeys().forEach((key) => localStorage.removeItem(key));
}

function failV3StateWrites() {
  const setItem = Storage.prototype.setItem;
  return vi.spyOn(Storage.prototype, "setItem").mockImplementation(function failStateWrite(
    this: Storage,
    key: string,
    value: string,
  ) {
    if (key === V3_STORAGE_KEYS.state) throw new DOMException("Quota exceeded", "QuotaExceededError");
    setItem.call(this, key, value);
  });
}

function createValidV3State(overrides: {
  profile?: Partial<NinefoldV3State["profile"]>;
  checkIns?: NinefoldV3State["checkIns"];
  meditation?: NinefoldV3State["meditation"];
} = {}): NinefoldV3State {
  const localDate = localDateKey();
  const createdAt = `${localDate}T08:00:00.000Z`;
  const profile = {
    version: V3_SCHEMA_VERSION,
    id: "v3-smoke-profile",
    stableSeed: FIXED_STABLE_SEED,
    nickname: "Ada",
    birthMonth: 9,
    birthDay: 3,
    zodiacSign: deriveZodiacSign(9, 3),
    cloudArchetype: "layered-horizon" as const,
    worldPrototype: 7 as const,
    personality: derivePersonalityPreferences({
      eOrI: "I",
      sOrN: "N",
      tOrF: "F",
      jOrP: "J",
    }),
    createdAt,
    preferredAmbientMode: "ocean" as const,
    ...overrides.profile,
  };

  return {
    version: V3_SCHEMA_VERSION,
    profile,
    world: {
      profileId: profile.id,
      bareTreeBorn: true,
      bornAt: createdAt,
      leafLayoutVersion: V3_LEAF_LAYOUT_VERSION,
    },
    checkIns: overrides.checkIns ?? {},
    meditation: overrides.meditation ?? {
      ...EMPTY_MEDITATION_PROGRESS_V3,
      sessions: [],
    },
  };
}

function seedV3State(overrides: Parameters<typeof createValidV3State>[0] = {}): NinefoldV3State {
  const state = createValidV3State(overrides);
  expect(ninefoldV3Storage.saveState(state)).toEqual({ ok: true });
  return state;
}

function seedWorldStageDraft(): DraftWorldIdentity {
  const draft: DraftWorldIdentity = {
    version: V3_SCHEMA_VERSION,
    stableSeed: FIXED_STABLE_SEED,
    stage: "world",
    birthMonth: 9,
    birthDay: 3,
    zodiacSign: "virgo",
    cloudArchetype: "layered-horizon",
    worldPrototype: 7,
    bareTreeBorn: false,
    preferredAmbientMode: "ocean",
    updatedAt: `${localDateKey()}T07:00:00.000Z`,
  };
  expect(ninefoldV3Storage.saveDraft(draft)).toEqual({ ok: true });
  return draft;
}

function expectOnePageHeading(): void {
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
}

beforeAll(() => {
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    value: vi.fn(),
    writable: true,
  });
});

beforeEach(() => {
  clearTestStorage();
  document.documentElement.lang = "en";
  document.body.classList.remove("ninefold-page-hidden", "ninefold-v3-builder-active");
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.history.replaceState({}, "", "/");
  document.body.classList.remove("ninefold-page-hidden", "ninefold-v3-builder-active");
  clearTestStorage();
});

describe("Ninefold V3 application journeys", () => {
  it.each([
    {
      route: "/en/",
      language: "en",
      pageTitle: "Create my Ninefold",
      question: "What day were you born?",
      sceneDescription: "An open sky waiting for its first star pattern, clouds and land.",
      switcherLabel: "Choose language",
    },
    {
      route: "/zh/",
      language: "zh-CN",
      pageTitle: "造出我的九境",
      question: "你出生在哪一天？",
      sceneDescription: "一片开阔的天空，正等待星图、云与土地出现。",
      switcherLabel: "选择语言",
    },
  ])("opens a new $language visitor in the empty-sky builder", async ({
    route,
    language,
    pageTitle,
    question,
    sceneDescription,
    switcherLabel,
  }) => {
    renderApp(route);

    expect(screen.getByRole("heading", { level: 1, name: pageTitle })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: question })).toBeInTheDocument();
    expect(screen.getByText(sceneDescription)).toBeInTheDocument();
    expect(document.querySelector(".v3-builder__world")).toHaveAttribute("data-stage", "sky");
    expect(document.body).toHaveClass("ninefold-v3-builder-active");
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
    const switcher = screen.getByRole("group", { name: switcherLabel });
    expect(within(switcher).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "中文",
      "EN",
    ]);
    await waitFor(() => expect(document.documentElement.lang).toBe(language));
    expectOnePageHeading();
  });

  it("builds from a valid date through zodiac and cloud into nine distinct worlds", async () => {
    const user = userEvent.setup();
    renderApp("/en/");

    await user.selectOptions(screen.getByLabelText("Birth month"), "9");
    await user.selectOptions(screen.getByLabelText("Birth day"), "3");
    await user.click(screen.getByRole("button", { name: "Place my stars" }));

    expect(screen.getByText(/Virgo has appeared in your sky\./)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What kind of clouds belong in your sky?" }))
      .toBeInTheDocument();
    const clouds = screen.getByRole("group", { name: "Choose a cloud form" });
    await user.click(within(clouds).getByRole("radio", { name: /Layered clouds/ }));
    await user.click(screen.getByRole("button", { name: "Keep these clouds" }));

    expect(screen.getByRole("heading", { name: "Which world feels like yours?" }))
      .toBeInTheDocument();
    const worlds = screen.getByRole("group", { name: "Choose one of nine worlds" });
    expect(within(worlds).getAllByRole("radio")).toHaveLength(9);
    expect(document.querySelectorAll(".v3-world-prototype")).toHaveLength(9);
    [
      "Dawn Ridge",
      "Confluence Meadow",
      "Windvoice Hill",
      "Stone Terrace",
      "Riverbend",
      "Sheltering Grove",
      "Quiet Mirror",
      "Far Horizon",
      "Returning Plain",
    ].forEach((world) => {
      expect(within(worlds).getByRole("radio", { name: new RegExp(world) })).toBeInTheDocument();
    });

    await user.click(within(worlds).getByRole("radio", { name: /Quiet Mirror/ }));
    expect(ninefoldV3Storage.readDraft()).toMatchObject({
      stableSeed: expect.any(String),
      stage: "world",
      birthMonth: 9,
      birthDay: 3,
      zodiacSign: "virgo",
      cloudArchetype: "layered-horizon",
      worldPrototype: 7,
    });
  });

  it("keeps the builder draft and semantic IDs unchanged across a language switch", async () => {
    const user = userEvent.setup();
    const original = seedWorldStageDraft();
    renderApp("/en/?from=smoke#world");

    expect(screen.getByRole("radio", { name: /Quiet Mirror/ })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Switch to Simplified Chinese" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-route")).toHaveTextContent("/zh/?from=smoke#world");
    });
    expect(screen.getByRole("heading", { name: "哪一片世界更像你的？" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /静镜湖/ })).toBeChecked();
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(ninefoldV3Storage.readDraft()).toMatchObject({
      stableSeed: original.stableSeed,
      stage: original.stage,
      birthMonth: original.birthMonth,
      birthDay: original.birthDay,
      zodiacSign: original.zodiacSign,
      cloudArchetype: original.cloudArchetype,
      worldPrototype: original.worldPrototype,
    });
  });

  it("keeps a completed builder on the final step when its profile cannot be persisted", async () => {
    const user = userEvent.setup();
    const completedDraft: DraftWorldIdentity = {
      ...seedWorldStageDraft(),
      stage: "personality",
      bareTreeBorn: true,
      nickname: "Ada",
      personalityAnswers: {
        eOrI: "I",
        sOrN: "N",
        tOrF: "F",
        jOrP: "J",
      },
    };
    expect(ninefoldV3Storage.saveDraft(completedDraft)).toEqual({ ok: true });
    const storedDraftBefore = localStorage.getItem(V3_STORAGE_KEYS.draft);
    renderApp("/en/");
    const writeFailure = failV3StateWrites();

    await user.click(screen.getByRole("button", { name: "See how I am today" }));

    expect(screen.getByTestId("current-route")).toHaveTextContent(/^\/en\/$/);
    expect(screen.getByRole("heading", { name: /closest to INFJ/ })).toBeInTheDocument();
    expect(ninefoldV3Storage.readState()).toBeNull();
    expect(localStorage.getItem(V3_STORAGE_KEYS.draft)).toBe(storedDraftBefore);
    writeFailure.mockRestore();
  });

  it.each([
    ["/en/", "/en/today", "Welcome back, Ada.", "en"],
    ["/zh/", "/zh/today", "Ada，欢迎回来。", "zh-CN"],
  ])("redirects a returning V3 visitor from %s to Today", async (
    route,
    expectedRoute,
    greeting,
    language,
  ) => {
    seedV3State();
    renderApp(route);

    await waitFor(() => expect(screen.getByTestId("current-route")).toHaveTextContent(expectedRoute));
    expect(screen.getByRole("heading", { level: 1, name: greeting })).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement.lang).toBe(language));
    expectOnePageHeading();
  });

  it.each([
    ["/en/today", "/en/", "Create my Ninefold"],
    ["/zh/growth", "/zh/", "造出我的九境"],
    ["/en/preferences", "/en/", "Create my Ninefold"],
  ])("guards %s when no V3 profile exists", async (route, expectedRoute, builderTitle) => {
    renderApp(route);

    await waitFor(() => expect(screen.getByTestId("current-route")).toHaveTextContent(expectedRoute));
    expect(screen.getByRole("heading", { level: 1, name: builderTitle })).toBeInTheDocument();
    expect(document.querySelector(".v3-builder__world")).toHaveAttribute("data-stage", "sky");
  });

  it("stores a deterministic four-layer reading from the 1–9 mood and energy check-in", async () => {
    const user = userEvent.setup();
    const state = seedV3State();
    const date = localDateKey();
    renderApp("/en/today");

    await user.click(screen.getByRole("radio", { name: "Mood 2 of 9" }));
    await user.click(screen.getByRole("radio", { name: "Energy 8 of 9" }));
    await user.click(screen.getByRole("button", { name: "See today’s reading" }));

    expect(await screen.findByRole("heading", { level: 2, name: "Today’s reading" }))
      .toBeInTheDocument();
    ["Your baseline", "Today’s state", "Ninefold reading", "What may suit you today"]
      .forEach((heading) => expect(screen.getByText(heading)).toBeInTheDocument());

    const expectedSemantics = createDailyReadingSemantics({
      localDate: date,
      stableSeed: state.profile.stableSeed,
      zodiacSign: state.profile.zodiacSign,
      personality: state.profile.personality,
      mood: 2,
      energy: 8,
    });
    const storedCheckIn = ninefoldV3Storage.readState()?.checkIns[date];
    expect(storedCheckIn).toMatchObject({
      localDate: date,
      mood: 2,
      energy: 8,
      derivedStateCell: "low-high",
    });
    expect(storedCheckIn?.semanticReading).toEqual(expectedSemantics);

    await user.click(screen.getByRole("button", { name: "Switch to Simplified Chinese" }));
    await waitFor(() => expect(screen.getByText("你的底色")).toBeInTheDocument());
    expect(ninefoldV3Storage.readState()?.checkIns[date]?.semanticReading).toEqual(expectedSemantics);
  });

  it("reports a failed check-in write without claiming the reading was saved", async () => {
    const user = userEvent.setup();
    seedV3State();
    const storedBefore = localStorage.getItem(V3_STORAGE_KEYS.state);
    renderApp("/en/today");
    const writeFailure = failV3StateWrites();

    await user.click(screen.getByRole("radio", { name: "Mood 4 of 9" }));
    await user.click(screen.getByRole("radio", { name: "Energy 6 of 9" }));
    await user.click(screen.getByRole("button", { name: "See today’s reading" }));

    expect(await screen.findByText("This change could not be saved. The current screen remains usable."))
      .toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Today’s reading" })).not.toBeInTheDocument();
    expect(localStorage.getItem(V3_STORAGE_KEYS.state)).toBe(storedBefore);
    writeFailure.mockRestore();
  });

  it("shows exactly one persistent leaf for one unique completed session", () => {
    const date = localDateKey();
    const completion = {
      sessionId: "v3-smoke-session",
      localDate: date,
      durationSeconds: 300 as const,
      ambientMode: "rain" as const,
      startedAt: `${date}T08:00:00.000Z`,
      completedAt: `${date}T08:05:00.000Z`,
    };
    const once = recordCompletedSession({
      ...EMPTY_MEDITATION_PROGRESS_V3,
      sessions: [],
    }, completion);

    expect(recordCompletedSession(once, completion)).toBe(once);
    seedV3State({ meditation: once });
    renderApp("/en/growth");

    expect(screen.getByText("Persistent leaves · 1")).toBeInTheDocument();
    expect(screen.getByText("Completed sessions · 1")).toBeInTheDocument();
    expect(screen.getByText("Breathing minutes · 5")).toBeInTheDocument();
    expect(document.querySelectorAll(".v3-world-leaf")).toHaveLength(1);
    expect(ninefoldV3Storage.readState()?.meditation).toMatchObject({
      totalCompletedSessions: 1,
      totalCompletedSeconds: 300,
      leafCount: 1,
      sessions: [expect.objectContaining({ sessionId: completion.sessionId, leafIndex: 0 })],
    });
  });

  it("reports a failed session write without claiming that a leaf was persisted", async () => {
    const user = userEvent.setup();
    const date = localDateKey();
    const state = createValidV3State();
    const semanticReading = createDailyReadingSemantics({
      localDate: date,
      stableSeed: state.profile.stableSeed,
      zodiacSign: state.profile.zodiacSign,
      personality: state.profile.personality,
      mood: 5,
      energy: 5,
    });
    expect(ninefoldV3Storage.saveState({
      ...state,
      checkIns: {
        [date]: {
          localDate: date,
          mood: 5,
          energy: 5,
          derivedStateCell: semanticReading.stateCell,
          semanticReading,
          updatedAt: `${date}T09:00:00.000Z`,
        },
      },
    })).toEqual({ ok: true });
    const storedBefore = localStorage.getItem(V3_STORAGE_KEYS.state);
    window.history.replaceState({}, "", "/?qaSpeed=600");
    renderApp("/en/today");
    const writeFailure = failV3StateWrites();

    await user.click(screen.getByRole("button", { name: "Begin breathing" }));

    expect(await screen.findByText(
      "This change could not be saved. The current screen remains usable.",
      {},
      { timeout: 3_000 },
    )).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "A new leaf has grown." })).not.toBeInTheDocument();
    expect(localStorage.getItem(V3_STORAGE_KEYS.state)).toBe(storedBefore);
    writeFailure.mockRestore();
  });

  it("reports a failed mute-preference write and keeps the persisted setting unchanged", async () => {
    const user = userEvent.setup();
    const date = localDateKey();
    const state = createValidV3State();
    const semanticReading = createDailyReadingSemantics({
      localDate: date,
      stableSeed: state.profile.stableSeed,
      zodiacSign: state.profile.zodiacSign,
      personality: state.profile.personality,
      mood: 5,
      energy: 5,
    });
    expect(ninefoldV3Storage.saveState({
      ...state,
      checkIns: {
        [date]: {
          localDate: date,
          mood: 5,
          energy: 5,
          derivedStateCell: semanticReading.stateCell,
          semanticReading,
          updatedAt: `${date}T09:00:00.000Z`,
        },
      },
    })).toEqual({ ok: true });
    renderApp("/en/today");
    const writeFailure = failV3StateWrites();

    await user.click(screen.getByRole("button", { name: "Begin breathing" }));
    await user.click(await screen.findByRole("button", { name: "Mute" }));

    expect(await screen.findByText("This change could not be saved. The current screen remains usable."))
      .toBeInTheDocument();
    expect(ninefoldV3Storage.readState()?.meditation.audioMuted).toBe(false);
    writeFailure.mockRestore();
  });

  it("resets only V3 state while preserving V1, V2 and unrelated storage", async () => {
    const user = userEvent.setup();
    seedV3State();
    const v1Sentinel = `${NINEFOLD_V1_STORAGE_PREFIX}legacy-sentinel`;
    const v2Sentinel = `${NINEFOLD_V2_STORAGE_PREFIX}stable-sentinel`;
    const unrelatedSentinel = `${TEST_SENTINEL_PREFIX}keep`;
    const extraV3Key = `${NINEFOLD_V3_STORAGE_PREFIX}temporary-smoke-key`;
    localStorage.setItem(v1Sentinel, "v1-kept");
    localStorage.setItem(v2Sentinel, "v2-kept");
    localStorage.setItem(unrelatedSentinel, "unrelated-kept");
    localStorage.setItem(extraV3Key, "remove-me");
    renderApp("/en/about");

    await user.click(screen.getByRole("button", { name: "Clear my V3 data" }));
    const dialog = screen.getByRole("alertdialog", { name: "Clear this Ninefold world?" });
    const cancel = within(dialog).getByRole("button", { name: "Cancel" });
    const confirm = within(dialog).getByRole("button", { name: "Clear V3 data" });
    await waitFor(() => expect(cancel).toHaveFocus());
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.click(confirm);

    await waitFor(() => expect(screen.getByTestId("current-route")).toHaveTextContent("/en/"));
    expect(screen.getByRole("heading", { level: 1, name: "Create my Ninefold" }))
      .toBeInTheDocument();
    expect(ninefoldV3Storage.readState()).toBeNull();
    expect(ninefoldV3Storage.readDraft()).toMatchObject({
      stage: "birth-date",
      bareTreeBorn: false,
    });
    expect(localStorage.getItem(extraV3Key)).toBeNull();
    expect(localStorage.getItem(v1Sentinel)).toBe("v1-kept");
    expect(localStorage.getItem(v2Sentinel)).toBe("v2-kept");
    expect(localStorage.getItem(unrelatedSentinel)).toBe("unrelated-kept");
    expectOnePageHeading();
  });

  it("pauses ambient motion while the browser tab is hidden", () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    renderApp("/en/");
    expect(document.body).not.toHaveClass("ninefold-page-hidden");

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(document.body).toHaveClass("ninefold-page-hidden");

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(document.body).not.toHaveClass("ninefold-page-hidden");
    delete (document as unknown as { visibilityState?: string }).visibilityState;
  });

  it("keeps V3 routes to one page heading with named navigation and language controls", () => {
    seedV3State();
    renderApp("/en/today");

    expectOnePageHeading();
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Choose language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open navigation" }))
      .toHaveAttribute("aria-expanded", "false");
    [...screen.getAllByRole("button"), ...screen.getAllByRole("link")]
      .forEach((control) => expect(control).toHaveAccessibleName());
  });

  it("uses only the documented V3 state key for a seeded profile", () => {
    seedV3State();
    expect(localStorage.getItem(V3_STORAGE_KEYS.state)).not.toBeNull();
    expect(ninefoldV3Storage.readState()?.version).toBe(V3_SCHEMA_VERSION);
  });
});
