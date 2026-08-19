import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { I18nProvider, LOCALE_STORAGE_KEY, useI18n } from "..";

function Probe() {
  const { locale, language, t, formatDate } = useI18n();
  const location = useLocation();
  return (
    <div>
      <output data-testid="locale">{locale}</output>
      <output data-testid="language">{language}</output>
      <output data-testid="brand">{t.brand.productName}</output>
      <output data-testid="date">{formatDate("2026-07-14")}</output>
      <output data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</output>
      <output data-testid="state">{JSON.stringify(location.state)}</output>
      <LanguageSwitcher />
    </div>
  );
}

describe("I18nProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "en";
  });

  it("derives Chinese from the route and updates the document language", async () => {
    render(
      <MemoryRouter initialEntries={["/zh/today"]}>
        <I18nProvider><Probe /></I18nProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("zh-CN");
    expect(screen.getByTestId("language")).toHaveTextContent("zh");
    expect(screen.getByTestId("brand")).toHaveTextContent("九境生息");
    expect(screen.getByTestId("date")).toHaveTextContent("2026年7月14日 星期二");
    await waitFor(() => expect(document.documentElement.lang).toBe("zh-CN"));
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("zh-CN");
  });

  it("switches the locale segment without losing route or experience state", async () => {
    const state = { stage: "rest", careAction: "observe", generated: true };
    render(
      <MemoryRouter initialEntries={[{
        pathname: "/zh/today",
        search: "?view=alternate",
        hash: "#reflection",
        state,
      }]}>
        <I18nProvider><Probe /></I18nProvider>
      </MemoryRouter>,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual(["中文", "EN"]);
    expect(screen.getByRole("button", { name: "切换至英文" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "切换至英文" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/en/today?view=alternate#reflection");
    });
    expect(screen.getByTestId("state")).toHaveTextContent(JSON.stringify(state));
    expect(screen.getByTestId("brand")).toHaveTextContent("Ninefold");
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });
});
