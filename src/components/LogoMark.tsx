import { useId } from "react";

export interface LogoMarkProps {
  className?: string;
  title?: string;
  decorative?: boolean;
  size?: number | string;
}

export function LogoMark({
  className,
  title = "Ninefold",
  decorative = true,
  size = 34,
}: LogoMarkProps) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `ninefold-logo-${generatedId}`;

  return (
    <svg
      className={["logo-mark", className ?? ""].filter(Boolean).join(" ")}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-labelledby={decorative ? undefined : titleId}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {!decorative && <title id={titleId}>{title}</title>}
      <circle className="logo-mark__orbit" cx="24" cy="24" r="18.25" stroke="currentColor" />
      <g className="logo-mark__petals" stroke="currentColor">
        {Array.from({ length: 9 }, (_, index) => (
          <path
            key={index}
            d="M24 5.75C27.1 11.2 27.1 16.05 24 21.1C20.9 16.05 20.9 11.2 24 5.75Z"
            transform={`rotate(${index * 40} 24 24)`}
          />
        ))}
      </g>
      <circle className="logo-mark__centre" cx="24" cy="24" r="3.15" fill="currentColor" />
      <circle className="logo-mark__core" cx="24" cy="24" r="1.15" />
    </svg>
  );
}

