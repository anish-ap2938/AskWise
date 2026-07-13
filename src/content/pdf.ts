// Lazy-loaded PDF text extraction. This module is only imported when the user
// attaches a .pdf, so pdf.js never weighs down normal page loads.
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerHref from "pdfjs-dist/build/pdf.worker.min.mjs?url";

const MAX_PAGES = 40;
const MAX_CHARS = 30000;

let configured = false;

function configureWorker() {
  if (configured) return;
  configured = true;
  // In a content script the asset must resolve to a chrome-extension:// URL.
  // Cross-origin Worker creation fails there, so pdf.js falls back to its
  // "fake worker" (main-thread) path via dynamic import — which works because
  // the asset is web-accessible.
  const path = workerHref.replace(/^\//, "");
  GlobalWorkerOptions.workerSrc =
    typeof chrome !== "undefined" && chrome.runtime?.getURL
      ? chrome.runtime.getURL(path)
      : workerHref;
}

export async function extractPdfText(data: ArrayBuffer): Promise<string> {
  configureWorker();
  const loadingTask = getDocument({ data });
  const doc = await loadingTask.promise;
  try {
    const pages = Math.min(doc.numPages, MAX_PAGES);
    let out = "";
    for (let i = 1; i <= pages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const line = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .trim();
      if (line) out += line + "\n\n";
      if (out.length > MAX_CHARS) break;
    }
    return out.trim();
  } finally {
    await loadingTask.destroy();
  }
}
