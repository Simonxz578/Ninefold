import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BreathingSession, type BreathingLabels } from "../BreathingSession";
import type { NatureSoundscape } from "../../audio/natureSoundscape";

const labels: BreathingLabels = {
  eyebrow: "Leave a moment",
  title: "Breathe with your world",
  subtitle: "One completed session grows one leaf.",
  durationLegend: "Choose a duration",
  oneMinute: "Breathe for 1 minute",
  fiveMinutes: "Breathe for 5 minutes",
  soundLegend: "Choose a soundscape",
  ocean: "Ocean",
  rain: "Rain",
  begin: "Begin breathing",
  skip: "Skip animation",
  exit: "Leave session",
  mute: "Mute",
  unmute: "Unmute",
  volume: "Ambient volume",
  progress: (remaining) => `${remaining} remaining`,
};

function createSoundscapeMock(): NatureSoundscape & {
  start: ReturnType<typeof vi.fn>;
  setMode: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
} {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    setMode: vi.fn(),
    setMuted: vi.fn(),
    setVolume: vi.fn(),
    suspend: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
  };
}

describe("V3 breathing session", () => {
  it("keeps audio off until Begin and lets tree birth skip without starting sound", async () => {
    const soundscape = createSoundscapeMock();
    const onComplete = vi.fn();
    const { unmount } = render(
      <BreathingSession
        kind="birth"
        labels={labels}
        onComplete={onComplete}
        soundscapeFactory={() => soundscape}
      />,
    );

    expect(soundscape.start).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Skip animation" }));
    expect(soundscape.start).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledWith({ durationSeconds: 60, ambientMode: "ocean", skipped: true });
    unmount();
  });

  it("offers only 1 and 5 minutes, starts the chosen Rain bed, and Escape aborts", async () => {
    const soundscape = createSoundscapeMock();
    const onComplete = vi.fn();
    const onExit = vi.fn();
    const user = userEvent.setup();
    render(
      <BreathingSession
        kind="daily"
        labels={labels}
        onComplete={onComplete}
        onExit={onExit}
        soundscapeFactory={() => soundscape}
      />,
    );

    const durationGroup = screen.getByRole("group", { name: "Choose a duration" });
    expect(durationGroup.querySelectorAll("button")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Breathe for 5 minutes" }));
    await user.click(screen.getByRole("button", { name: "Rain" }));
    await user.click(screen.getByRole("button", { name: "Begin breathing" }));
    await waitFor(() => expect(soundscape.start).toHaveBeenCalledWith("rain", 0.32, false));

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(onExit).toHaveBeenCalledTimes(1));
    expect(onComplete).not.toHaveBeenCalled();
    expect(soundscape.stop).toHaveBeenCalled();
  });

  it("starts with persisted audio preferences and reports mute and volume changes", async () => {
    const soundscape = createSoundscapeMock();
    const onMutedChange = vi.fn();
    const onVolumeChange = vi.fn();
    const user = userEvent.setup();
    render(
      <BreathingSession
        kind="daily"
        labels={labels}
        defaultMuted
        defaultVolume={0.46}
        onMutedChange={onMutedChange}
        onVolumeChange={onVolumeChange}
        onComplete={vi.fn()}
        soundscapeFactory={() => soundscape}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Begin breathing" }));
    await waitFor(() => expect(soundscape.start).toHaveBeenCalledWith("ocean", 0.46, true));

    const volume = screen.getByRole("slider", { name: "Ambient volume" });
    expect(volume).toHaveValue("0.46");
    expect(volume).toHaveAttribute("aria-valuetext", "46%");
    fireEvent.change(volume, { target: { value: "0.7" } });
    expect(onVolumeChange).toHaveBeenLastCalledWith(0.7);
    expect(soundscape.setVolume).toHaveBeenLastCalledWith(0.7);
    expect(volume).toHaveAttribute("aria-valuetext", "70%");

    await user.click(screen.getByRole("button", { name: "Unmute" }));
    expect(onMutedChange).toHaveBeenLastCalledWith(false);
    expect(soundscape.setMuted).toHaveBeenLastCalledWith(false);

    await user.click(screen.getByRole("button", { name: "Mute" }));
    expect(onMutedChange).toHaveBeenLastCalledWith(true);
    expect(soundscape.setMuted).toHaveBeenLastCalledWith(true);
  });
});
