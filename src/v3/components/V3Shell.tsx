import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogoMark } from "../../components/LogoMark";
import { localizedPath, stripLocale, useI18n, type Locale } from "../../i18n";
import { getV3Copy } from "../copy";

export interface V3ShellProps {
  children: ReactNode;
  builderMode?: boolean;
}

const languageOptions: ReadonlyArray<{
  locale: Locale;
  lang: string;
  label: "chinese" | "english";
  ariaLabel: "switchToChinese" | "switchToEnglish";
}> = [
  { locale: "zh-CN", lang: "zh-CN", label: "chinese", ariaLabel: "switchToChinese" },
  { locale: "en", lang: "en", label: "english", ariaLabel: "switchToEnglish" },
];

export function V3Shell({ children, builderMode = false }: V3ShellProps) {
  const { pathname } = useLocation();
  const { locale, setLocale } = useI18n();
  const copy = getV3Copy(locale);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const route = stripLocale(pathname);
  const navigation = [
    { path: "/world", label: locale === "zh-CN" ? "九境" : "Ninefold" },
    { path: "/today", label: copy.navigation.today },
    { path: "/growth", label: copy.navigation.growth },
    { path: "/about", label: locale === "zh-CN" ? "原理" : "Method" },
  ] as const;

  useEffect(() => {
    setNavigationOpen(false);
  }, [pathname]);

  useEffect(() => {
    const syncPageVisibility = () => {
      document.body.classList.toggle("ninefold-page-hidden", document.visibilityState === "hidden");
    };

    syncPageVisibility();
    document.addEventListener("visibilitychange", syncPageVisibility);
    return () => {
      document.removeEventListener("visibilitychange", syncPageVisibility);
      document.body.classList.remove("ninefold-page-hidden");
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("ninefold-v3-builder-active", builderMode);
    return () => document.body.classList.remove("ninefold-v3-builder-active");
  }, [builderMode]);

  return (
    <div className={`v3-shell${builderMode ? " v3-shell--builder" : ""}`}>
      <a className="skip-link v3-shell__skip-link" href="#v3-main-content">
        {copy.navigation.skipToContent}
      </a>

      <header className="v3-shell__header">
        <div className="v3-shell__header-inner">
          <NavLink
            className="v3-shell__brand"
            to={localizedPath(builderMode ? "/" : "/world", locale)}
            aria-label={copy.brand.homeLabel}
          >
            <LogoMark />
            <span>{copy.brand.lockup}</span>
          </NavLink>

          <div className="v3-shell__header-actions">
            {!builderMode && (
              <>
                <button
                  className="v3-shell__nav-toggle"
                  type="button"
                  aria-expanded={navigationOpen}
                  aria-controls="v3-primary-navigation"
                  aria-label={navigationOpen ? copy.navigation.closeMenu : copy.navigation.openMenu}
                  onClick={() => setNavigationOpen((open) => !open)}
                >
                  <span aria-hidden="true">{navigationOpen ? "×" : "≡"}</span>
                </button>

                <nav
                  id="v3-primary-navigation"
                  className={`v3-shell__navigation${navigationOpen ? " is-open" : ""}`}
                  aria-label={copy.navigation.label}
                >
                  {navigation.map((item) => {
                    const current = route === item.path || (route === "/" && item.path === "/today");
                    return (
                      <NavLink
                        key={item.path}
                        to={localizedPath(item.path, locale)}
                        className={current ? "is-active" : undefined}
                        aria-current={current ? "page" : undefined}
                        onClick={() => setNavigationOpen(false)}
                      >
                        {item.label}
                      </NavLink>
                    );
                  })}
                </nav>
              </>
            )}

            <div className="v3-shell__language" role="group" aria-label={copy.language.label}>
              {languageOptions.map((option, index) => {
                const active = locale === option.locale;
                return (
                  <span className="v3-shell__language-option" key={option.locale}>
                    {index > 0 && <span aria-hidden="true">/</span>}
                    <button
                      type="button"
                      lang={option.lang}
                      className={active ? "is-active" : undefined}
                      aria-label={copy.language[option.ariaLabel]}
                      aria-pressed={active}
                      onClick={() => setLocale(option.locale)}
                    >
                      {copy.language[option.label]}
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main id="v3-main-content" className="v3-shell__main" tabIndex={-1}>
        {children}
      </main>

      {!builderMode && (
        <footer className="v3-shell__footer">
          <p>{copy.brand.promise}</p>
          <NavLink to={localizedPath("/preferences", locale)}>
            {copy.navigation.preferences}
          </NavLink>
        </footer>
      )}
    </div>
  );
}
