export type SvgDownloadResult =
  | { ok: true; filename: string }
  | { ok: false; error: string };

interface SvgElementLike {
  outerHTML: string;
}

export interface SvgDownloadEnvironment {
  Blob: typeof Blob;
  URL: Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;
  document: Pick<Document, "createElement" | "body">;
}

function svgMarkup(source: string | SvgElementLike): string {
  const markup = typeof source === "string" ? source.trim() : source.outerHTML.trim();
  if (!/^<svg(?:\s|>)/i.test(markup) || !/<\/svg>$/i.test(markup)) {
    throw new TypeError("The download source is not a complete SVG document.");
  }
  if (
    /<(?:script|foreignObject)\b/i.test(markup) ||
    /\son[a-z]+\s*=/i.test(markup) ||
    /(?:href|xlink:href)\s*=\s*["']\s*javascript:/i.test(markup)
  ) {
    throw new TypeError("Unsafe executable SVG content is not downloadable.");
  }
  let normalized = markup;
  if (!/\sxmlns=/.test(normalized)) {
    normalized = normalized.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!/\swidth=/.test(normalized)) {
    normalized = normalized.replace(/^<svg/i, '<svg width="1080"');
  }
  if (!/\sheight=/.test(normalized)) {
    normalized = normalized.replace(/^<svg/i, '<svg height="1080"');
  }
  if (!/\spreserveAspectRatio=/.test(normalized)) {
    normalized = normalized.replace(/^<svg/i, '<svg preserveAspectRatio="xMidYMid meet"');
  }
  return normalized;
}

function defaultEnvironment(): SvgDownloadEnvironment | undefined {
  const candidate = globalThis as unknown as Partial<SvgDownloadEnvironment>;
  return candidate.Blob && candidate.URL?.createObjectURL && candidate.document
    ? (candidate as SvgDownloadEnvironment)
    : undefined;
}

export function downloadSvg(
  source: string | SvgElementLike,
  filename: string,
  environment: SvgDownloadEnvironment | undefined = defaultEnvironment(),
): SvgDownloadResult {
  let objectUrl: string | null = null;
  try {
    if (!environment) return { ok: false, error: "SVG downloads are unavailable in this browser." };
    const safeFilename = filename.toLowerCase().endsWith(".svg") ? filename : `${filename}.svg`;
    const blob = new environment.Blob([svgMarkup(source)], {
      type: "image/svg+xml;charset=utf-8",
    });
    objectUrl = environment.URL.createObjectURL(blob);
    const anchor = environment.document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = safeFilename;
    anchor.style.display = "none";
    environment.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return { ok: true, filename: safeFilename };
  } catch {
    return { ok: false, error: "The SVG could not be prepared for download." };
  } finally {
    if (objectUrl && environment) {
      try {
        environment.URL.revokeObjectURL(objectUrl);
      } catch {
        // The temporary URL is best-effort cleanup after the user-visible result.
      }
    }
  }
}
