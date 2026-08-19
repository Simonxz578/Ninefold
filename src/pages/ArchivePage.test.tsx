import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { createDailyEntry, createSampleWeek } from "../domain";
import { I18nProvider } from "../i18n";
import { ArchivePage } from "./ArchivePage";

afterEach(cleanup);

function renderArchive() {
  const entries = createSampleWeek("2026-07-13");
  return render(
    <MemoryRouter initialEntries={["/en/archive"]}>
      <I18nProvider>
        <ArchivePage
          entries={entries}
          onLoadSample={() => ({ ok: true, message: "loaded" })}
          onRemoveSamples={() => ({ ok: true, message: "removed" })}
          onSwitchVariant={vi.fn()}
          getShareCaption={() => "share"}
        />
      </I18nProvider>
    </MemoryRouter>,
  );
}

describe("ArchivePage V2 growth views", () => {
  it("starts in Living View and lets each of the latest seven traces be toggled", async () => {
    const user = userEvent.setup();
    renderArchive();

    expect(screen.getByRole("button", { name: "Living View" })).toHaveAttribute("aria-pressed", "true");
    const livingPanel = screen.getByRole("region", { name: "Living View" });
    const landscape = within(livingPanel).getByRole("figure");
    expect(landscape.getAttribute("data-care-action")).toMatch(/nourish|release|protect|open|observe/);
    expect(livingPanel.querySelector(".path-growth")).toHaveAttribute("data-event-count", "7");
    const sampleCareActions = new Set(
      [...livingPanel.querySelectorAll(".path-growth__event")]
        .flatMap((event) => [...event.classList])
        .filter((className) => className.startsWith("path-growth__event--")),
    );
    expect(sampleCareActions.size).toBeGreaterThanOrEqual(3);

    const layers = within(livingPanel).getAllByRole("checkbox");
    expect(layers).toHaveLength(7);
    await user.click(layers[0]!);
    expect(livingPanel.querySelector(".path-growth")).toHaveAttribute("data-event-count", "6");
  });

  it("keeps sample traces out of Recent activity when real history exists", async () => {
    const user = userEvent.setup();
    const realEntry = createDailyEntry(
      { id: "mixed-profile", pathNumber: 4, createdAt: "2026-07-14T07:00:00.000Z" },
      { energy: 3, clarity: 4, connection: "balanced", focus: "work" },
      "2026-07-14",
      { now: "2026-07-14T08:00:00.000Z" },
    );
    const samples = createSampleWeek("2026-07-07");
    render(
      <MemoryRouter initialEntries={["/en/archive"]}>
        <I18nProvider>
          <ArchivePage
            entries={[...samples, realEntry]}
            onLoadSample={() => ({ ok: true, message: "loaded" })}
            onRemoveSamples={() => ({ ok: true, message: "removed" })}
            onSwitchVariant={vi.fn()}
            getShareCaption={() => "share"}
          />
        </I18nProvider>
      </MemoryRouter>,
    );

    const livingPanel = screen.getByRole("region", { name: "Living View" });
    expect(within(livingPanel).getAllByRole("checkbox")).toHaveLength(1);
    expect(within(livingPanel).getByRole("checkbox")).toHaveAccessibleName(/14 July/);

    await user.click(screen.getByRole("radio", { name: "Sample week" }));
    expect(within(livingPanel).getAllByRole("checkbox")).toHaveLength(7);
  });

  it("keeps the weekly export and historical ResultView in Memory View", async () => {
    const user = userEvent.setup();
    renderArchive();

    await user.click(screen.getByRole("button", { name: "Memory View" }));
    const memoryPanel = screen.getByRole("region", { name: "Memory View" });
    expect(within(memoryPanel).getByRole("button", { name: "Download seven-day SVG" })).toBeInTheDocument();
    expect(memoryPanel.querySelectorAll(".archive-card")).toHaveLength(7);

    const firstCard = memoryPanel.querySelector<HTMLButtonElement>(".archive-card");
    expect(firstCard).not.toBeNull();
    await user.click(firstCard!);
    expect(screen.getByRole("region", { name: /Historical detail:/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close historical detail" })).toBeInTheDocument();
  });

  it("uses localized weekly templates and SVG accessibility copy in Chinese", async () => {
    const user = userEvent.setup();
    const entries = createSampleWeek("2026-07-13");
    render(
      <MemoryRouter initialEntries={["/zh/growth"]}>
        <I18nProvider>
          <ArchivePage
            entries={entries}
            onLoadSample={() => ({ ok: true, message: "loaded" })}
            onRemoveSamples={() => ({ ok: true, message: "removed" })}
            onSwitchVariant={vi.fn()}
            getShareCaption={() => "share"}
          />
        </I18nProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "每日记忆" }));
    const memoryPanel = screen.getByRole("region", { name: "每日记忆" });
    expect(within(memoryPanel).getByRole("img", { name: /一周小结/ })).toBeInTheDocument();
    expect(within(memoryPanel).getByText(/最常出现的视觉方向/)).toBeInTheDocument();
    expect(within(memoryPanel).getByRole("button", { name: "下载七日 SVG" })).toBeInTheDocument();

    const firstCard = memoryPanel.querySelector<HTMLButtonElement>(".archive-card");
    expect(firstCard).not.toBeNull();
    await user.click(firstCard!);
    expect(screen.getByRole("region", { name: /历史详情：/ })).toBeInTheDocument();
  });

  it("requires explicit confirmation before adding samples beside real history", async () => {
    const user = userEvent.setup();
    const realEntry = createDailyEntry(
      { id: "real-profile", pathNumber: 4, createdAt: "2026-07-14T07:00:00.000Z" },
      { energy: 3, clarity: 4, connection: "balanced", focus: "work" },
      "2026-07-14",
      { now: "2026-07-14T08:00:00.000Z" },
    );
    const onLoadSample = vi.fn(() => ({ ok: true, message: "loaded" }));
    render(
      <MemoryRouter initialEntries={["/en/archive?sample=1"]}>
        <I18nProvider>
          <ArchivePage
            entries={[realEntry]}
            onLoadSample={onLoadSample}
            onRemoveSamples={() => ({ ok: true, message: "removed" })}
            onSwitchVariant={vi.fn()}
            getShareCaption={() => "share"}
          />
        </I18nProvider>
      </MemoryRouter>,
    );

    const dialog = screen.getByRole("alertdialog", { name: /Add a sample week beside your history/ });
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(onLoadSample).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Add sample week" }));
    expect(onLoadSample).toHaveBeenCalledWith(true);
  });
});
