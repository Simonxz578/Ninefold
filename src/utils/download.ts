export function downloadTextFile(
  contents: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([contents], { type: mimeType });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

export function serializeSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", "1080");
  clone.setAttribute("height", "1080");
  clone.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
}

export function downloadSvgById(id: string, filename: string): boolean {
  const svg = document.getElementById(id);
  if (!(svg instanceof SVGSVGElement)) return false;
  downloadTextFile(serializeSvg(svg), filename, "image/svg+xml;charset=utf-8");
  return true;
}
