import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { PdfToImgError } from "../shared/errors";
import {
  isTypedArray,
  normalizeLegacyOptions,
  resolveLegacyPages,
  resolveLegacyScale,
  shouldReturnSingle,
} from "./shared";
import type { NormalizedLegacyOptions } from "./shared";
import type { LegacyOptions, LegacyPdfSrc, LegacyReturn } from "./types";

export async function pdfToImg<
  O extends LegacyOptions = LegacyOptions,
  S extends LegacyPdfSrc | LegacyPdfSrc[] = LegacyPdfSrc | LegacyPdfSrc[],
>(src: S, options?: O): Promise<LegacyReturn<O, S>> {
  const handler = (input: LegacyPdfSrc) =>
    singlePdfToImg(input, options as LegacyOptions);
  if (Array.isArray(src)) {
    const results = await Promise.all(src.map(handler));
    return results as LegacyReturn<O, S>;
  }
  return (await handler(src)) as LegacyReturn<O, S>;
}

export async function singlePdfToImg(
  src: LegacyPdfSrc,
  options?: Partial<LegacyOptions>,
): Promise<string | string[]> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const normalized = normalizeLegacyOptions(options);
  const input = await resolveBrowserInput(src);

  const isChrome =
    typeof navigator !== "undefined" &&
    /chrome|chromium/i.test(navigator.userAgent);

  const task = pdfjsLib.getDocument({
    ...(input.data ? { data: input.data } : { url: input.url }),
    disableWorker: !pdfjsLib.GlobalWorkerOptions.workerSrc,
    ...(isChrome ? { isChrome: true } : {}),
    ...normalized.documentOptions,
  } as any);
  const doc = await task.promise;
  const pages = resolveLegacyPages(normalized.pages, doc.numPages);
  const results = await Promise.all(
    pages.map((pageNumber) => renderLegacyPage(doc, pageNumber, normalized)),
  );
  await doc.destroy();

  return shouldReturnSingle(normalized.pages) ? results[0] : results;
}

async function resolveBrowserInput(
  src: LegacyPdfSrc | Blob,
): Promise<{ data?: Uint8Array; url?: string }> {
  if (typeof src === "string") {
    return { url: src };
  }
  if (src instanceof URL) {
    return { url: src.toString() };
  }
  if (src instanceof ArrayBuffer) {
    return { data: new Uint8Array(src) };
  }
  if (isTypedArray(src)) {
    // Normalize to Uint8Array so downstream pdf.js types accept the buffer.
    return {
      data: new Uint8Array(src.buffer, src.byteOffset, src.byteLength),
    };
  }
  if (src instanceof Blob) {
    const buffer = new Uint8Array(await src.arrayBuffer());
    return { data: buffer };
  }
  throw new PdfToImgError("E_INPUT", "Unsupported legacy input type.");
}

async function renderLegacyPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  options: NormalizedLegacyOptions,
): Promise<string> {
  const page = await doc.getPage(pageNumber);
  const baseScale = options.scale;
  const baseViewport = page.getViewport({ scale: baseScale });
  const scale = resolveLegacyScale(
    baseScale,
    baseViewport.width,
    baseViewport.height,
    options,
  );
  const viewport =
    scale === baseScale ? baseViewport : page.getViewport({ scale });

  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new PdfToImgError("E_RENDER", "Failed to get canvas context.");
  }

  await page.render({
    // pdf.js RenderParameters expects a CanvasRenderingContext2D even though
    // OffscreenCanvas returns OffscreenCanvasRenderingContext2D.
    canvasContext: context as unknown as CanvasRenderingContext2D,
    canvas: canvas as unknown as HTMLCanvasElement,
    viewport,
    background: options.background || "rgb(255,255,255)",
    intent: options.intent || "display",
  }).promise;

  page.cleanup();

  const mime = options.imgType === "jpg" ? "image/jpeg" : "image/png";
  return canvasToDataUrl(canvas, mime);
}

function createCanvas(
  width: number,
  height: number,
): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document === "undefined") {
    throw new PdfToImgError("E_ENV", "Document is not available.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function canvasToDataUrl(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  mime: string,
): Promise<string> {
  if ("toDataURL" in canvas) {
    return (canvas as HTMLCanvasElement).toDataURL(mime);
  }
  const blob = await canvas.convertToBlob({ type: mime });
  return blobToDataUrl(blob);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  if (typeof FileReader === "undefined") {
    return blob.arrayBuffer().then((buffer) => {
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      return `data:${blob.type};base64,${base64}`;
    });
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image blob."));
    reader.readAsDataURL(blob);
  });
}
