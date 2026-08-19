import { useState } from "react";
import { useI18n } from "../i18n";
import { downloadSvgById } from "../utils/download";

interface ShareActionsProps {
  svgId: string;
  filename: string;
  caption: string;
}

async function copyText(text: string): Promise<void> {
  const clipboard = (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
  if (clipboard) {
    let timeoutId: number | undefined;
    try {
      await Promise.race([
        clipboard.writeText(text),
        new Promise<never>((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error("Clipboard timed out")), 1_200);
        }),
      ]);
      window.clearTimeout(timeoutId);
      return;
    } catch {
      window.clearTimeout(timeoutId);
      // Some embedded browsers expose Clipboard API methods that never settle.
      // Continue to the local selection-based fallback in that case.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  let copied = false;
  try {
    textarea.select();
    copied = document.execCommand("copy");
  } finally {
    textarea.remove();
  }
  if (!copied) throw new Error("Clipboard unavailable");
}

export function ShareActions({ svgId, filename, caption }: ShareActionsProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState("");
  const nativeShare = Reflect.get(navigator, "share") as
    | ((data?: ShareData) => Promise<void>)
    | undefined;

  const download = () => {
    try {
      if (!downloadSvgById(svgId, filename)) throw new Error("Pattern unavailable");
      setStatus(t.share.downloaded);
    } catch {
      setStatus(t.share.downloadFailed);
    }
  };

  const copy = async () => {
    try {
      await copyText(caption);
      setStatus(t.share.copied);
    } catch {
      setStatus(t.share.copyUnavailable);
    }
  };

  const share = async () => {
    if (!nativeShare) {
      await copy();
      return;
    }
    try {
      await nativeShare.call(navigator, { title: t.share.nativeTitle, text: caption });
      setStatus(t.share.shareOpened);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copy();
    }
  };

  return (
    <div className="share-panel">
      <div className="share-panel__heading">
        <div>
          <p className="eyebrow">{t.share.eyebrow}</p>
          <h2>{t.share.title}</h2>
        </div>
        <span aria-hidden="true">↗</span>
      </div>
      <div className="share-panel__actions">
        <button className="button button--secondary" type="button" onClick={download}>{t.share.downloadSvg}</button>
        <button className="button button--secondary" type="button" onClick={copy}>{t.share.copyCaption}</button>
        <button className="button button--secondary" type="button" onClick={() => void share()}>
          {nativeShare ? t.share.share : t.share.copyToShare}
        </button>
      </div>
      <details className="caption-preview">
        <summary>{t.share.preview}</summary>
        <pre>{caption}</pre>
      </details>
      <p className="share-panel__status" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
