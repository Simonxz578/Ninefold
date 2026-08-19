import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { stripLocale } from "../i18n";

export function ScrollToTop() {
  const { pathname, search } = useLocation();
  const previousLocation = useRef(stripLocale(`${pathname}${search}`));

  useLayoutEffect(() => {
    const location = stripLocale(`${pathname}${search}`);
    const routeChanged = previousLocation.current !== location;
    previousLocation.current = location;
    if (!routeChanged) return undefined;
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    (document.scrollingElement ?? root).scrollTop = 0;
    root.scrollTop = 0;
    document.body.scrollTop = 0;
    root.style.scrollBehavior = previousBehavior;

    const frame = window.requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>("#main-content h1");
      if (!heading) return;
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
      heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, search]);

  return null;
}
