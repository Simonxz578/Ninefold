import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AmbientSoundscape } from "../../../audio/ambientSoundscape";
import {
  DEFAULT_REST_SESSION_PROGRESS,
  type RestSessionProgress,
} from "../../../domain/restSession";
import { RestMode } from "../RestMode";
import { SessionGrowthLayer } from "../SessionGrowthLayer";

const INITIAL_PROGRESS: RestSessionProgress = {
  ...DEFAULT_REST_SESSION_PROGRESS,
};

function createAudioMock() {
  const soundscape = {
    start: vi.fn(async () => undefined),
    setMuted: vi.fn(),
    setVolume: vi.fn(),
    beginGrowth: vi.fn(),
    complete: vi.fn(),
    suspend: vi.fn(async () => undefined),
    resume: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
    destroy: vi.fn(async () => undefined),
  } satisfies AmbientSoundscape;

  return {
    soundscape,
    audioFactory: vi.fn(() => soundscape),
  };
}

function renderRestMode({
  audioFactory,
  initialDuration = 30,
  locale = "en",
  onClose = vi.fn(),
  onProgressChange = vi.fn(),
  progress = INITIAL_PROGRESS,
}: Partial<React.ComponentProps<typeof RestMode>> = {}) {
  return render(
    <RestMode
      open
      onClose={onClose}
      initialDuration={initialDuration}
      locale={locale}
      progress={progress}
      onProgressChange={onProgressChange}
      audioFactory={audioFactory}
    >
      <svg aria-label="Test landscape" viewBox="0 0 1200 720" />
    </RestMode>,
  );
}

async function advanceTime(milliseconds: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

describe("RestMode session flow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T08:00:00.000Z"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("keeps audio silent in setup and starts it only from Begin rest", async () => {
    const { audioFactory, soundscape } = createAudioMock();
    renderRestMode({ audioFactory });

    await advanceTime(0);
    expect(screen.getByRole("button", { name: "Return" })).toHaveFocus();
    expect(audioFactory).not.toHaveBeenCalled();
    expect(soundscape.start).not.toHaveBeenCalled();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Begin rest" }));
    await advanceTime(0);

    expect(audioFactory).toHaveBeenCalledTimes(1);
    expect(soundscape.start).toHaveBeenCalledWith(0.3, false);
    expect(screen.getByText("Resting with the landscape")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("0:30");
    expect(screen.getByRole("button", { name: "Exit rest" })).toHaveFocus();
  });

  it("offers five minutes as the default timed Rest choice", async () => {
    const { audioFactory, soundscape } = createAudioMock();
    const onProgressChange = vi.fn();
    const { container } = render(
      <RestMode
        open
        onClose={vi.fn()}
        progress={INITIAL_PROGRESS}
        onProgressChange={onProgressChange}
        audioFactory={audioFactory}
      >
        <svg aria-label="Test landscape" viewBox="0 0 1200 720" />
      </RestMode>,
    );

    await advanceTime(0);
    expect(screen.getByRole("button", { name: "5 minutes" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-rest-growth-step", "0");

    fireEvent.click(screen.getByRole("button", { name: "Begin rest" }));
    expect(screen.getByRole("timer")).toHaveTextContent("5:00");
    await advanceTime(30_000);
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-rest-growth-step", "1");

    await advanceTime(270_000);
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-phase", "growth");
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-rest-growth-step", "10");
    expect(onProgressChange).toHaveBeenCalledTimes(1);
    expect(onProgressChange).toHaveBeenCalledWith(expect.objectContaining({
      completedSessions: 1,
      totalCompletedSeconds: 300,
      growthStage: 1,
      lastCompletedAt: "2026-08-04T08:05:00.000Z",
    }));
    expect(soundscape.beginGrowth).toHaveBeenCalledTimes(1);
  });

  it("does not award growth when a timed session exits early", async () => {
    const { audioFactory, soundscape } = createAudioMock();
    const onProgressChange = vi.fn();
    const onClose = vi.fn();
    renderRestMode({ audioFactory, onClose, onProgressChange });

    await advanceTime(0);
    fireEvent.click(screen.getByRole("button", { name: "Begin rest" }));
    await advanceTime(29_750);
    fireEvent.click(screen.getByRole("button", { name: "Exit rest" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onProgressChange).not.toHaveBeenCalled();
    expect(soundscape.beginGrowth).not.toHaveBeenCalled();
    expect(soundscape.stop).toHaveBeenCalledTimes(1);
  });

  it("keeps an open-ended session running without awarding growth", async () => {
    const { audioFactory, soundscape } = createAudioMock();
    const onProgressChange = vi.fn();
    const { container } = renderRestMode({ audioFactory, onProgressChange });

    await advanceTime(0);
    fireEvent.click(screen.getByRole("button", { name: "Open-ended" }));
    fireEvent.click(screen.getByRole("button", { name: "Begin rest" }));
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-rest-growth-step", "0");

    await advanceTime(29_999);
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-rest-growth-step", "0");
    await advanceTime(1);
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-rest-growth-step", "1");

    await advanceTime(270_000);
    expect(screen.getByRole("timer")).toHaveTextContent("5:00");
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-rest-growth-step", "10");
    await advanceTime(60_000);

    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-rest-growth-step", "10");
    expect(onProgressChange).not.toHaveBeenCalled();
    expect(soundscape.beginGrowth).not.toHaveBeenCalled();
  });

  it("awards one timed session, enters growth, and settles into completion", async () => {
    const { audioFactory, soundscape } = createAudioMock();
    const onProgressChange = vi.fn();
    const { container } = renderRestMode({ audioFactory, onProgressChange });

    await advanceTime(0);
    fireEvent.click(screen.getByRole("button", { name: "Begin rest" }));
    await advanceTime(30_000);

    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-phase", "growth");
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-entering-stage", "1");
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-rest-growth-step", "1");
    expect(screen.getByText("The tree is growing")).toBeInTheDocument();
    expect(onProgressChange).toHaveBeenCalledTimes(1);
    expect(onProgressChange).toHaveBeenCalledWith(expect.objectContaining({
      completedSessions: 1,
      totalCompletedSeconds: 30,
      growthStage: 1,
      audioMuted: false,
      audioVolume: 0.3,
      lastCompletedAt: "2026-08-04T08:00:30.000Z",
    }));
    expect(soundscape.beginGrowth).toHaveBeenCalledTimes(1);

    await advanceTime(15_999);
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-phase", "growth");
    expect(soundscape.complete).not.toHaveBeenCalled();

    await advanceTime(1);
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-phase", "complete");
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-rest-growth-step", "1");
    expect(screen.getByText("Growth complete")).toBeInTheDocument();
    expect(soundscape.complete).toHaveBeenCalledTimes(1);

    await advanceTime(60_000);
    expect(onProgressChange).toHaveBeenCalledTimes(1);
    expect(soundscape.complete).toHaveBeenCalledTimes(1);
  });

  it("retains two milestones through growth and completion after one minute", async () => {
    const { audioFactory } = createAudioMock();
    const onProgressChange = vi.fn();
    const { container } = renderRestMode({
      audioFactory,
      initialDuration: 60,
      onProgressChange,
    });

    await advanceTime(0);
    fireEvent.click(screen.getByRole("button", { name: "Begin rest" }));
    await advanceTime(60_000);

    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-phase", "growth");
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-rest-growth-step", "2");
    expect(onProgressChange).toHaveBeenCalledTimes(1);
    expect(onProgressChange).toHaveBeenCalledWith(expect.objectContaining({
      totalCompletedSeconds: 60,
    }));

    await advanceTime(16_000);
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-phase", "complete");
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-rest-growth-step", "2");
  });

  it("records a stage-five renewal without advancing beyond the final stage", async () => {
    const { audioFactory, soundscape } = createAudioMock();
    const onProgressChange = vi.fn();
    const stageFiveProgress: RestSessionProgress = {
      ...INITIAL_PROGRESS,
      completedSessions: 7,
      totalCompletedSeconds: 300,
      growthStage: 5,
    };
    const { container } = renderRestMode({
      audioFactory,
      onProgressChange,
      progress: stageFiveProgress,
    });

    await advanceTime(0);
    fireEvent.click(screen.getByRole("button", { name: "Begin rest" }));
    await advanceTime(30_000);

    const restMode = container.querySelector(".rest-mode");
    expect(restMode).toHaveAttribute("data-phase", "growth");
    expect(restMode).toHaveAttribute("data-entering-stage", "5");
    expect(restMode).toHaveAttribute("data-growth-stage", "5");
    expect(restMode).toHaveClass("rest-mode--renewal");
    expect(onProgressChange).toHaveBeenCalledTimes(1);
    expect(onProgressChange).toHaveBeenCalledWith(expect.objectContaining({
      completedSessions: 8,
      totalCompletedSeconds: 330,
      growthStage: 5,
      lastCompletedAt: "2026-08-04T08:00:30.000Z",
    }));
    expect(soundscape.beginGrowth).toHaveBeenCalledTimes(1);

    await advanceTime(76_000);
    expect(onProgressChange).toHaveBeenCalledTimes(1);
  });

  it("uses the reduced-motion completion window when requested", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }));
    const { audioFactory } = createAudioMock();
    const { container } = renderRestMode({ audioFactory });

    await advanceTime(0);
    fireEvent.click(screen.getByRole("button", { name: "Begin rest" }));
    await advanceTime(30_000);
    expect(container.querySelector(".rest-mode")).toHaveClass("rest-mode--reduced");
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-phase", "growth");

    await advanceTime(899);
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-phase", "growth");
    await advanceTime(1);
    expect(container.querySelector(".rest-mode")).toHaveAttribute("data-phase", "complete");
  });

  it("persists mute and volume choices and applies them to the soundscape", async () => {
    const { audioFactory, soundscape } = createAudioMock();
    const onProgressChange = vi.fn();
    renderRestMode({ audioFactory, onProgressChange });

    await advanceTime(0);
    fireEvent.click(screen.getByRole("button", { name: "Mute" }));
    fireEvent.change(screen.getByRole("slider", { name: "Volume" }), {
      target: { value: "0.65" },
    });

    expect(audioFactory).not.toHaveBeenCalled();
    expect(onProgressChange).toHaveBeenNthCalledWith(1, expect.objectContaining({
      audioMuted: true,
      audioVolume: 0.3,
    }));
    expect(onProgressChange).toHaveBeenNthCalledWith(2, expect.objectContaining({
      audioMuted: true,
      audioVolume: 0.65,
    }));

    fireEvent.click(screen.getByRole("button", { name: "Begin rest" }));
    expect(soundscape.start).toHaveBeenCalledWith(0.65, true);
    fireEvent.click(screen.getByRole("button", { name: "Unmute" }));

    expect(soundscape.setMuted).toHaveBeenCalledWith(false);
    expect(onProgressChange).toHaveBeenLastCalledWith(expect.objectContaining({
      audioMuted: false,
      audioVolume: 0.65,
    }));
  });

  it("exposes the complete Chinese setup and active labels", async () => {
    const { audioFactory } = createAudioMock();
    renderRestMode({ audioFactory, locale: "zh-CN" });

    await advanceTime(0);
    expect(screen.getByRole("heading", { name: "在这片风景中停留" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始停留" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5 分钟" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "静音" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "音量" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "开始停留" }));
    await advanceTime(0);
    expect(screen.getByText("正在风景中停留")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "退出停留" })).toHaveFocus();
  });
});

describe("SessionGrowthLayer", () => {
  afterEach(cleanup);

  it("keeps every unlocked SVG stage mounted as later growth accumulates", () => {
    const { container, rerender } = render(
      <svg viewBox="0 0 1200 720">
        <SessionGrowthLayer path={4} stage={0} trunkPath="M600 570V240" />
      </svg>,
    );

    expect(container.querySelectorAll("[data-session-growth-stage]")).toHaveLength(0);

    rerender(
      <svg viewBox="0 0 1200 720">
        <SessionGrowthLayer path={4} stage={3} trunkPath="M600 570V240" />
      </svg>,
    );
    expect(Array.from(container.querySelectorAll("[data-session-growth-stage]"))
      .map((element) => element.getAttribute("data-session-growth-stage")))
      .toEqual(["1", "2", "3"]);
    expect(container.querySelector(".session-growth__ecology--grass")).toBeInTheDocument();

    rerender(
      <svg viewBox="0 0 1200 720">
        <SessionGrowthLayer path={4} stage={5} trunkPath="M600 570V240" />
      </svg>,
    );
    expect(Array.from(container.querySelectorAll("[data-session-growth-stage]"))
      .map((element) => element.getAttribute("data-session-growth-stage")))
      .toEqual(["1", "2", "3", "4", "5"]);
    expect(container.querySelector(".session-growth__ecology--life")).toBeInTheDocument();
    expect(container.querySelector(".session-growth__ecology--complete")).toBeInTheDocument();
    expect(container.querySelector(".session-growth__renewal")).toBeInTheDocument();
  });
});
