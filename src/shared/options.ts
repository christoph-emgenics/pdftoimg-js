import {
  BrowserOutputOptions,
  CommonOptions,
  NamingOptions,
  NodeOutputOptions,
  OutputFormat,
  ThumbnailOptions,
} from "./types";
import { normalizeRotation, resolveQuality, resolveScale } from "./utils";

export interface NormalizedCommonOptions {
  pages: CommonOptions["pages"];
  format: OutputFormat;
  quality?: number;
  scale: number;
  maxConcurrency: number;
  background: string;
  password?: string;
  pageRotation: number;
  naming: NamingOptions;
  thumbnails?: NormalizedThumbnailOptions;
  postProcess?: CommonOptions["postProcess"];
}

export interface NormalizedThumbnailOptions {
  scale: number;
  format: OutputFormat;
  quality?: number;
  naming: NamingOptions;
}

export interface NormalizedNodeOutput {
  outputDir?: string;
  inMemory: boolean;
}

export interface NormalizedBrowserOutput {
  inMemory: boolean;
  outputType: "blob" | "bytes";
}

const DEFAULT_NAMING: NamingOptions = {
  pattern: "{basename}-p{page}.{ext}",
  zeroPad: "auto",
};

const DEFAULT_THUMB_SCALE = 0.25;

export function normalizeCommonOptions(
  options: CommonOptions | undefined
): NormalizedCommonOptions {
  const format = options?.format ?? "png";
  const scale = resolveScale(options?.scale, options?.dpi);
  const naming = { ...DEFAULT_NAMING, ...options?.naming };

  const thumbnails = normalizeThumbnailOptions(options?.thumbnails, format);

  return {
    pages: options?.pages ?? "all",
    format,
    quality: resolveQuality(format, options?.quality),
    scale,
    maxConcurrency: Math.max(1, options?.maxConcurrency ?? 4),
    background: options?.background ?? "transparent",
    password: options?.password,
    pageRotation: normalizeRotation(options?.pageRotation),
    naming,
    thumbnails,
    postProcess: options?.postProcess,
  };
}

function normalizeThumbnailOptions(
  thumbs: ThumbnailOptions | undefined,
  fallbackFormat: OutputFormat
): NormalizedThumbnailOptions | undefined {
  if (!thumbs) {
    return undefined;
  }
  const format = thumbs.format ?? fallbackFormat;
  const hasScale = thumbs.scale !== undefined || thumbs.dpi !== undefined;
  const scale = hasScale
    ? resolveScale(thumbs.scale, thumbs.dpi)
    : DEFAULT_THUMB_SCALE;
  return {
    scale,
    format,
    quality: resolveQuality(format, thumbs.quality),
    naming: {
      ...DEFAULT_NAMING,
      ...thumbs.naming,
      pattern: thumbs.naming?.pattern ?? "{basename}-p{page}-thumb.{ext}",
    },
  };
}

export function normalizeNodeOutput(
  output: NodeOutputOptions | undefined
): NormalizedNodeOutput {
  const inMemory = output?.inMemory ?? false;
  return {
    outputDir: output?.outputDir ?? (inMemory ? undefined : "output"),
    inMemory,
  };
}

export function normalizeBrowserOutput(
  output: BrowserOutputOptions | undefined
): NormalizedBrowserOutput {
  return {
    inMemory: output?.inMemory ?? true,
    outputType: output?.outputType ?? "blob",
  };
}
