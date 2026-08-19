import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareActions } from "../components/ShareActions";
import { I18nProvider } from "../i18n";

const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const execCommandDescriptor = Object.getOwnPropertyDescriptor(document, "execCommand");

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  else Reflect.deleteProperty(navigator, "clipboard");
  if (execCommandDescriptor) Object.defineProperty(document, "execCommand", execCommandDescriptor);
  else Reflect.deleteProperty(document, "execCommand");
});

describe("ShareActions", () => {
  it("falls back cleanly when an embedded Clipboard API never settles", async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn(() => new Promise<void>(() => undefined)) },
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => {
        throw new Error("copy unavailable");
      }),
    });

    render(
      <MemoryRouter initialEntries={["/en/today"]}>
        <I18nProvider>
          <ShareActions
            svgId="test-pattern"
            filename="test.svg"
            caption="My safe Ninefold caption"
          />
        </I18nProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy caption" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_250);
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Copy is unavailable in this browser",
    );
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).toBeNull();
  });
});
