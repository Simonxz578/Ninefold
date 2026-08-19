import { Component, type ReactNode } from "react";
import { dictionaries } from "../i18n";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const locale = document.documentElement.lang === "zh-CN" ? "zh-CN" : "en";
    const t = dictionaries[locale];
    return (
      <main className="page state-page container" id="main-content">
        <p className="eyebrow">{t.brand.productName}</p>
        <h1>{t.errors.boundaryTitle}</h1>
        <p>{t.errors.boundaryBody}</p>
        <button
          className="button button--primary"
          type="button"
          onClick={() => {
            this.setState({ failed: false });
            window.location.hash = locale === "zh-CN" ? "#/zh/" : "#/en/";
          }}
        >
          {t.errors.returnHome}
        </button>
      </main>
    );
  }
}
