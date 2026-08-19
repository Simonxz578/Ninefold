import type { ReactNode } from "react";

interface InlineNoticeProps {
  children: ReactNode;
  tone?: "info" | "success" | "warning" | "error";
  live?: boolean;
}

export function InlineNotice({ children, tone = "info", live = false }: InlineNoticeProps) {
  return (
    <div
      className={`notice notice--${tone}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={live ? "polite" : "off"}
    >
      {children}
    </div>
  );
}
