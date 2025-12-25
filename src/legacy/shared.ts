import type { LegacyDocumentParams, LegacyOptions, LegacyPagesType } from "./types";

export interface NormalizedLegacyOptions {
  imgType: "png" | "jpg";
  scale: number;
  background: string | CanvasGradient | CanvasPattern | undefined;
  intent: "display" | "print" | "any";
  pages: LegacyPagesType;
  documentOptions: LegacyDocumentParams;
  maxWidth: number | null;
  maxHeight: number | null;
  scaleForBrowserSupport: boolean;
}

const DEFAULT_OPTIONS: NormalizedLegacyOptions = {
  imgType: "png",
  scale: 1,
  background: "rgb(255,255,255)",
  intent: "display",
  pages: "all",
  documentOptions: {},
  maxWidth: null,
  maxHeight: null,
  scaleForBrowserSupport: false,
};

export function normalizeLegacyOptions(
  options: LegacyOptions | undefined
): NormalizedLegacyOptions {
  return {
    imgType: options?.imgType ?? DEFAULT_OPTIONS.imgType,
    scale: options?.scale ?? DEFAULT_OPTIONS.scale,
    background: options?.background ?? DEFAULT_OPTIONS.background,
    intent: options?.intent ?? DEFAULT_OPTIONS.intent,
    pages: options?.pages ?? DEFAULT_OPTIONS.pages,
    documentOptions: options?.documentOptions ?? {},
    maxWidth: options?.maxWidth ?? DEFAULT_OPTIONS.maxWidth,
    maxHeight: options?.maxHeight ?? DEFAULT_OPTIONS.maxHeight,
    scaleForBrowserSupport:
      options?.scaleForBrowserSupport ?? DEFAULT_OPTIONS.scaleForBrowserSupport,
  };
}

export function resolveLegacyPages(
  pages: LegacyPagesType,
  totalPages: number
): number[] {
  if (pages === "firstPage") {
    return [1];
  }
  if (pages === "lastPage") {
    return [totalPages];
  }
  if (typeof pages === "number") {
    return [Math.max(1, pages)];
  }
  if (Array.isArray(pages)) {
    return pages.length ? pages : [1];
  }
  if (typeof pages === "object" && pages) {
    return makeRange(pages.startPage ?? 1, pages.endPage ?? totalPages);
  }
  return makeRange(1, totalPages);
}

export function resolveLegacyScale(
  baseScale: number,
  width: number,
  height: number,
  options: NormalizedLegacyOptions
): number {
  if (!options.scaleForBrowserSupport && !options.maxWidth && !options.maxHeight) {
    return baseScale;
  }
  const maxWidth = options.maxWidth ?? 4096;
  const maxHeight = options.maxHeight ?? 4096;
  const widthScale = maxWidth / width;
  const heightScale = maxHeight / height;
  const scaleFactor = Math.min(widthScale, heightScale, 1);
  return baseScale * scaleFactor;
}

export function shouldReturnSingle(pages: LegacyPagesType): boolean {
  return pages === "firstPage" || pages === "lastPage" || typeof pages === "number";
}

export function isTypedArray(value: unknown): value is
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array {
  return (
    value instanceof Int8Array ||
    value instanceof Uint8Array ||
    value instanceof Uint8ClampedArray ||
    value instanceof Int16Array ||
    value instanceof Uint16Array ||
    value instanceof Int32Array ||
    value instanceof Uint32Array ||
    value instanceof Float32Array ||
    value instanceof Float64Array
  );
}

function makeRange(start: number, end?: number): number[] {
  const resolvedStart = end !== undefined ? start : 1;
  const resolvedEnd = end !== undefined ? end : start;
  return Array.from(
    { length: resolvedEnd - resolvedStart + 1 },
    (_, idx) => resolvedStart + idx
  );
}
