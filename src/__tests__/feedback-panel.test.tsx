import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FeedbackPanel } from "../components/FeedbackPanel";
import { I18nProvider } from "../i18n";

describe("FeedbackPanel", () => {
  it("does not claim feedback was saved when persistence fails", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/en/today"]}>
        <I18nProvider>
          <FeedbackPanel
            onSelect={() => ({
              ok: false,
              message: "Feedback is visible for this session, but it could not be saved for reload.",
            })}
          />
        </I18nProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Useful" }));
    expect(screen.getByRole("status")).toHaveTextContent(/could not be saved/i);
    expect(screen.getByRole("status")).not.toHaveTextContent(/feedback saved/i);
  });

  it("uses independently authored Chinese feedback labels", () => {
    render(
      <MemoryRouter initialEntries={["/zh/today"]}>
        <I18nProvider>
          <FeedbackPanel onSelect={() => ({ ok: true })} />
        </I18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "这次回望与你的感受相合吗？" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "有帮助" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "与我的输入不符" })).toBeInTheDocument();
  });
});
