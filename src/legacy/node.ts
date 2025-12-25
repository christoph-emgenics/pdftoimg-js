import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { loadCanvasAdapter, ensureImageData } from "../node/canvas";
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

const DEFAULT_CMAP_URL = "node_modules/pdfjs-dist/cmaps/";
const DEFAULT_STANDARD_FONTS_URL = "node_modules/pdfjs-dist/standard_fonts/";

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
  const input = resolveNodeInput(src);
  const adapter = await loadCanvasAdapter();
  ensureImageData(adapter);

  const task = pdfjsLib.getDocument({
    standardFontDataUrl: DEFAULT_STANDARD_FONTS_URL,
    cMapUrl: DEFAULT_CMAP_URL,
    cMapPacked: true,
    ...(input.data ? { data: input.data } : { url: input.url }),
    ...normalized.documentOptions,
  });
  const doc = await task.promise;
  const pages = resolveLegacyPages(normalized.pages, doc.numPages);
  const results = await Promise.all(
    pages.map((pageNumber) =>
      renderLegacyPage(doc, pageNumber, normalized, adapter.module),
    ),
  );
  await doc.destroy();

  return shouldReturnSingle(normalized.pages) ? results[0] : results;
}

function resolveNodeInput(src: LegacyPdfSrc): {
  data?: Uint8Array;
  url?: string;
} {
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
    // Normalize to Uint8Array to satisfy pdf.js data expectations.
    return {
      data: new Uint8Array(src.buffer, src.byteOffset, src.byteLength),
    };
  }
  throw new PdfToImgError("E_INPUT", "Unsupported legacy input type.");
}

async function renderLegacyPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  options: NormalizedLegacyOptions,
  canvasModule: Awaited<ReturnType<typeof loadCanvasAdapter>>["module"],
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

  const canvas = canvasModule.createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new PdfToImgError("E_RENDER", "Failed to get canvas context.");
  }

  await page.render({
    canvasContext: context as unknown as CanvasRenderingContext2D,
    canvas: canvas as unknown as HTMLCanvasElement,
    viewport,
    background: options.background || "rgb(255,255,255)",
    intent: options.intent || "display",
  }).promise;

  page.cleanup();

  const mime = options.imgType === "jpg" ? "image/jpeg" : "image/png";
  const buffer = canvas.toBuffer(mime);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
