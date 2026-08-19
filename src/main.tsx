import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ScrollToTop } from "./components/ScrollToTop";
import "./styles.css";
import "./v2.css";

const root = document.getElementById("root");
if (!root) throw new Error("Ninefold could not find its application root.");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <ScrollToTop />
        <App />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
);
