import { useEffect, useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { localizedPath, useI18n } from "../i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LogoMark } from "./LogoMark";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const { locale, t } = useI18n();

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
  const navigation = [
    { to: localizedPath("/today", locale), label: t.navigation.today },
    { to: localizedPath("/archive", locale), label: t.navigation.growth },
    { to: localizedPath("/about", locale), label: t.navigation.method },
  ];
  const brandLabel = locale === "zh-CN" ? t.brand.productName : t.brand.englishName;

  return (
    <div className="app-shell">
      <button
        className="skip-link"
        type="button"
        onClick={() => document.getElementById("main-content")?.focus({ preventScroll: false })}
      >
        {t.navigation.skipToContent}
      </button>
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink
            className="brand"
            to={localizedPath("/", locale)}
            aria-label={`${brandLabel} · ${t.navigation.home}`}
          >
            <LogoMark />
            <span>{brandLabel}</span>
          </NavLink>
          <button
            className="nav-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="primary-navigation"
            aria-label={`${open ? t.common.close : t.common.expand} ${t.navigation.label}`}
            onClick={() => setOpen((value) => !value)}
          >
            <span aria-hidden="true">{open ? "×" : "≡"}</span>
          </button>
          <nav
            className={`site-nav${open ? " site-nav--open" : ""}`}
            id="primary-navigation"
            aria-label={t.navigation.label}
          >
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) => (isActive ? "is-active" : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div>
            <span className="site-footer__brand">{brandLabel}</span>
            <p>{t.brand.definition}</p>
          </div>
          <nav aria-label={t.navigation.label}>
            <NavLink to={localizedPath("/about", locale)}>{t.navigation.method}</NavLink>
            <NavLink to={localizedPath("/onboarding", locale)}>{t.onboarding.eyebrow}</NavLink>
          </nav>
          <p className="site-footer__note">{t.brand.safety}</p>
        </div>
      </footer>
      <LanguageSwitcher />
    </div>
  );
}
