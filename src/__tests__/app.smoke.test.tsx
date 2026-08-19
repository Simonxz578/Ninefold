import {
  act,
  cleanup,
  fireEvent,
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
import { createDailyEntry } from "../domain/daily";
import {
  NINEFOLD_V1_STORAGE_PREFIX,
  NINEFOLD_V2_STORAGE_PREFIX,
  ninefoldV2Storage,
} from "../domain/v2Storage";
import type { DailyCheckIn, DailyEntry, Profile } from "../domain/types";
import { localDateKey } from "../utils/date";

const DEFAULT_CHECK_IN: DailyCheckIn = {
  energy: 4,
  clarity: 2,
  connection: "balanced",
  focus: "work",
};

function RouteProbe() {
  const location = useLocation();
  return (
    <output data-testid="current-route">
      {`${location.pathname}${location.search}${location.hash}`}
    </output>
  );
}

function ownedStorageKeys(): string[] {
  return Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
    .filter((key): key is string => Boolean(
      key?.startsWith(NINEFOLD_V1_STORAGE_PREFIX) ||
      key?.startsWith(NINEFOLD_V2_STORAGE_PREFIX),
    ));
}

function clearNinefoldKeys(): void {
  ownedStorageKeys().forEach((key) => localStorage.removeItem(key));
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

function createProfile(overrides: Partial<Profile> = {}): Profile {
  const date = localDateKey();
  return {
    id: "v2-smoke-profile",
    displayName: "Ada",
    pathNumber: 7,
    createdAt: `${date}T07:00:00.000Z`,
    ...overrides,
  };
}

function seedProfile(overrides: Partial<Profile> = {}): Profile {
  const profile = createProfile(overrides);
  expect(ninefoldV2Storage.saveProfile(profile)).toEqual({ ok: true });
  return profile;
}

function seedToday(
  profile: Profile,
  checkIn: DailyCheckIn = DEFAULT_CHECK_IN,
): DailyEntry {
  const date = localDateKey();
  const entry = createDailyEntry(profile, checkIn, date, {
    now: `${date}T08:00:00.000Z`,
  });
  expect(ninefoldV2Storage.saveEntry(entry)).toEqual({ ok: true });
  return entry;
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
  clearNinefoldKeys();
  document.documentElement.lang = "en";
  document.body.classList.remove("rest-mode-active");
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.body.classList.remove("rest-mode-active");
  clearNinefoldKeys();
});

describe("Ninefold V2 localized application paths", () => {
  it.each([
    {
      route: "/en/",
      language: "en",
      heading: "A place that grows when you return.",
      primary: "Enter your landscape",
      primaryHref: "/en/onboarding",
      secondary: "Explore a sample week",
      secondaryHref: "/en/archive?sample=1",
      switcherLabel: "Choose language",
    },
    {
      route: "/zh/",
      language: "zh-CN",
      heading: "一片因你的归来而生长的风景。",
      primary: "进入你的风景",
      primaryHref: "/zh/onboarding",
      secondary: "看看一周如何生长",
      secondaryHref: "/zh/archive?sample=1",
      switcherLabel: "选择语言",
    },
  ])("renders the $language landing route with localized CTAs", async ({
    route,
    language,
    heading,
    primary,
    primaryHref,
    secondary,
    secondaryHref,
    switcherLabel,
  }) => {
    renderApp(route);

    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: primary })).toHaveAttribute("href", primaryHref);
    expect(screen.getByRole("link", { name: secondary })).toHaveAttribute("href", secondaryHref);
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      expect.stringContaining("ninefold-world-tree-key-art.webp"),
    );
    const switcher = screen.getByRole("group", { name: switcherLabel });
    expect(within(switcher).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "中文",
      "EN",
    ]);
    await waitFor(() => expect(document.documentElement.lang).toBe(language));
    expectOnePageHeading();
  });

  it("shows nine genuinely separate Path previews during onboarding", async () => {
    const user = userEvent.setup();
    renderApp("/en/onboarding");

    await user.click(screen.getByRole("button", { name: /continue/i }));
    const pathGroup = screen.getByRole("radiogroup", { name: "Choose a Path" });
    const choices = within(pathGroup).getAllByRole("radio");

    expect(choices).toHaveLength(9);
    expect(document.querySelectorAll(".path-choice__preview")).toHaveLength(9);
    [
      "Initiation",
      "Connection",
      "Expression",
      "Structure",
      "Movement",
      "Care",
      "Reflection",
      "Realisation",
      "Integration",
    ].forEach((pathName) => {
      expect(within(pathGroup).getByRole("radio", { name: new RegExp(pathName, "i") }))
        .toBeInTheDocument();
    });
    expectOnePageHeading();
  });

  it("keeps the onboarding step and selected Path when language changes", async () => {
    const user = userEvent.setup();
    renderApp("/en/onboarding");

    await user.click(screen.getByRole("button", { name: /continue/i }));
    const expression = screen.getByRole("radio", { name: /3 expression/i });
    await user.click(expression);
    expect(expression).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Switch to Simplified Chinese" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-route")).toHaveTextContent("/zh/onboarding");
    });
    expect(screen.getByText("第 2 步，共 4 步")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /3 表达/ })).toBeChecked();
    expect(screen.getByRole("radiogroup", { name: "选择一条心径" })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("zh-CN");
  });

  it("completes Arrive → Attune → Tend → Grow and persists the chosen care action", () => {
    vi.useFakeTimers();
    const profile = seedProfile({ pathNumber: 5 });
    renderApp("/en/today");

    expect(screen.getByRole("heading", { name: "Welcome back, Ada." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /arrive in today/i }));

    expect(screen.getByRole("heading", { name: "Attune to today" })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("group", { name: "Energy" }))
      .getByRole("radio", { name: /4 high/i }));
    fireEvent.click(within(screen.getByRole("group", { name: "Clarity" }))
      .getByRole("radio", { name: /2 low/i }));
    fireEvent.click(within(screen.getByRole("group", { name: "Focus" }))
      .getByRole("radio", { name: "Work" }));
    fireEvent.change(screen.getByRole("textbox", { name: /private note/i }), {
      target: { value: "A private thought that must remain local." },
    });
    fireEvent.click(screen.getByRole("button", { name: /continue to tending/i }));

    expect(screen.getByRole("heading", { name: "How would you like to meet today?" }))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /protect make a small shelter/i }));
    fireEvent.click(screen.getByRole("button", { name: /grow today’s landscape/i }));

    expect(screen.getByRole("heading", { name: "Today is joining your landscape." }))
      .toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6_400));

    expect(screen.getByText("Today’s growth has settled.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "How today took shape" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View from another angle" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Rest with this landscape" })).toBeInTheDocument();

    const storedEntry = ninefoldV2Storage.readEntry(localDateKey());
    expect(storedEntry?.checkIn).toMatchObject({
      energy: 4,
      clarity: 2,
      focus: "work",
      note: "A private thought that must remain local.",
    });
    expect(ninefoldV2Storage.readLandscape()).toMatchObject({
      profileId: profile.id,
      path: 5,
      events: [expect.objectContaining({ careAction: "protect" })],
    });
  });

  it("switches a generated Today view to Chinese without changing route state or configuration", async () => {
    const user = userEvent.setup();
    const profile = seedProfile({ pathNumber: 3 });
    const entry = seedToday(profile);
    const before = structuredClone(entry.original.configuration);
    renderApp("/en/today?view=alternate#reflection");

    expect(screen.getByRole("heading", { level: 2, name: /today asks for room, not speed/i }))
      .toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Switch to Simplified Chinese" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-route"))
        .toHaveTextContent("/zh/today?view=alternate#reflection");
    });
    expect(screen.getByRole("heading", { level: 2, name: /今天需要的不是更快，而是留出空间/ }))
      .toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "今天如何成形" }))
      .toBeInTheDocument();
    expect(document.documentElement.lang).toBe("zh-CN");

    const after = ninefoldV2Storage.readEntry(localDateKey());
    expect(after?.original.configuration).toEqual(before);
    expect(after?.reframeUsed).toBe(false);
    expect(after?.activeVariant).toBe("original");
  });

  it("closes Rest mode with Escape and restores focus to its opener", async () => {
    const user = userEvent.setup();
    const profile = seedProfile();
    seedToday(profile);
    renderApp("/en/today");

    const opener = screen.getByRole("button", { name: "Begin resting" });
    await user.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Rest with this landscape" });
    const close = within(dialog).getByRole("button", { name: "Return" });
    await waitFor(() => expect(close).toHaveFocus());
    expect(document.body).toHaveClass("rest-mode-active");

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Rest with this landscape" }))
      .not.toBeInTheDocument());
    expect(opener).toHaveFocus();
    expect(document.body).not.toHaveClass("rest-mode-active");
  });

  it("loads a labelled sample landscape and exposes both Living and Memory views", async () => {
    const user = userEvent.setup();
    renderApp("/en/archive");

    expect(screen.getByRole("heading", { name: "A landscape needs its first trace." }))
      .toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load sample week" }));

    expect(await screen.findByText("Sample week added without changing any real entry."))
      .toBeInTheDocument();
    expect(ninefoldV2Storage.readEntries()).toHaveLength(7);
    expect(ninefoldV2Storage.readEntries().every((entry) => entry.isSample)).toBe(true);
    expect(screen.getByRole("button", { name: "Living View" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Living View" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Memory View" }));

    expect(screen.getByRole("button", { name: "Memory View" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Memory View" })).toBeInTheDocument();
    expect(document.querySelectorAll(".memory-card")).toHaveLength(7);
    expect(document.querySelectorAll(".sample-badge")).toHaveLength(7);
    expectOnePageHeading();
  });

  it("clears only Ninefold-owned data and preserves confirmation focus behaviour", async () => {
    const user = userEvent.setup();
    seedProfile();
    localStorage.setItem(`${NINEFOLD_V1_STORAGE_PREFIX}legacy-extra`, "owned");
    localStorage.setItem("another-product:keep", "untouched");
    renderApp("/en/about");

    await user.click(screen.getByRole("button", { name: "Clear my local data" }));
    const dialog = screen.getByRole("alertdialog", { name: "Clear all Ninefold data?" });
    const cancel = within(dialog).getByRole("button", { name: "Cancel" });
    const confirm = within(dialog).getByRole("button", { name: "Clear Ninefold data" });
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.click(confirm);

    await waitFor(() => expect(screen.getByTestId("current-route"))
      .toHaveTextContent("/en/onboarding"));
    expect(ownedStorageKeys()).toEqual([]);
    expect(localStorage.getItem("another-product:keep")).toBe("untouched");
    expect(ninefoldV2Storage.readProfile()).toBeNull();
    expectOnePageHeading();
    localStorage.removeItem("another-product:keep");
  });

  it("moves focus to the next localized page heading after client navigation", async () => {
    const user = userEvent.setup();
    renderApp("/en/");

    await user.click(screen.getByRole("link", { name: "Today" }));
    const heading = await screen.findByRole("heading", {
      level: 1,
      name: "Choose how your world grows.",
    });
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it("pauses ambient animation while the browser tab is hidden", () => {
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

  it.each([
    ["/en/", "Primary navigation", "Choose language", "en"],
    ["/en/today", "Primary navigation", "Choose language", "en"],
    ["/en/onboarding", "Primary navigation", "Choose language", "en"],
    ["/en/archive", "Primary navigation", "Choose language", "en"],
    ["/en/about", "Primary navigation", "Choose language", "en"],
    ["/zh/", "主导航", "选择语言", "zh-CN"],
    ["/zh/today", "主导航", "选择语言", "zh-CN"],
    ["/zh/onboarding", "主导航", "选择语言", "zh-CN"],
    ["/zh/archive", "主导航", "选择语言", "zh-CN"],
    ["/zh/about", "主导航", "选择语言", "zh-CN"],
  ])("%s exposes one h1 and accessible controls", async (
    route,
    navigationLabel,
    switcherLabel,
    language,
  ) => {
    renderApp(route);

    expectOnePageHeading();
    expect(document.getElementById("primary-navigation")).toHaveAccessibleName(navigationLabel);
    expect(screen.getByRole("group", { name: switcherLabel })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(navigationLabel) }))
      .toHaveAttribute("aria-expanded", "false");
    [...screen.getAllByRole("button"), ...screen.getAllByRole("link")]
      .forEach((control) => expect(control).toHaveAccessibleName());
    await waitFor(() => expect(document.documentElement.lang).toBe(language));
  });
});
