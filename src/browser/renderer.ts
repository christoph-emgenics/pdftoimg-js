import {
  BrowserConvertOptions,
  ConversionResult,
  PostProcessPayload,
  RenderedPage,
} from "../shared/types";
import {
  normalizeBrowserOutput,
  normalizeCommonOptions,
} from "../shared/options";
import { normalizePageRange } from "../shared/range";
import { createLimiter } from "../shared/limiter";
import { now } from "../shared/utils";
import { BrowserInput, readBrowserInput } from "./input";
import { loadPdfDocument } from "./pdf";

export async function convert(
  input: BrowserInput,
  options?: BrowserConvertOptions,
): Promise<ConversionResult> {
  const timings = { load: 0, parse: 0, render: 0, encode: 0, save: 0 };
  const startLoad = now();
  const inputData = await readBrowserInput(input);
  timings.load = now() - startLoad;

  const normalized = normalizeCommonOptions(options);
  const output = normalizeBrowserOutput(options?.output);

  const startParse = now();
  const doc = await loadPdfDocument({
    data: inputData.data,
    url: inputData.url,
    password: normalized.password,
  });
  timings.parse = now() - startParse;

  const totalPages = doc.numPages;
  const pages = normalizePageRange(normalized.pages, totalPages);
  const limiter = createLimiter(normalized.maxConcurrency);

  const renderTasks = pages.map((pageNumber) =>
    limiter(async () => {
      const page = await doc.getPage(pageNumber);
      const rotation = (page.rotate + normalized.pageRotation) % 360;
      const main = await renderVariant({
        page,
        pageNumber,
        rotation,
        scale: normalized.scale,
        format: normalized.format,
        quality: normalized.quality,
        background: normalized.background,
        output,
        timings,
        variant: "main",
        postProcess: normalized.postProcess,
      });

      let thumb: RenderedPage | undefined;
      if (normalized.thumbnails) {
        thumb = await renderVariant({
          page,
          pageNumber,
          rotation,
          scale: normalized.thumbnails.scale,
          format: normalized.thumbnails.format,
          quality: normalized.thumbnails.quality,
          background: normalized.background,
          output,
          timings,
          variant: "thumbnail",
          postProcess: normalized.postProcess,
        });
      }

      page.cleanup();
      return { main, thumb };
    }),
  );

  const rendered = await Promise.all(renderTasks);
  await doc.destroy();

  const pagesOut = rendered.map((item) => item.main).sort(sortByPage);
  const thumbsOut = rendered
    .map((item) => item.thumb)
    .filter((v) => typeof v != "undefined" && typeof v == "object")
    .sort(sortByPage);

  return {
    pages: pagesOut,
    thumbnails: thumbsOut.length ? thumbsOut : undefined,
    totalPages,
    timings,
  };
}

function sortByPage(a: RenderedPage | undefined, b: RenderedPage | undefined) {
  if (!a || !b) {
    return 0;
  }
  return a.pageNumber - b.pageNumber;
}

async function renderVariant(options: {
  page: any;
  pageNumber: number;
  rotation: number;
  scale: number;
  format: BrowserConvertOptions["format"];
  quality?: number;
  background: string;
  output: ReturnType<typeof normalizeBrowserOutput>;
  timings: { render: number; encode: number };
  variant: "main" | "thumbnail";
  postProcess?: BrowserConvertOptions["postProcess"];
}): Promise<RenderedPage> {
  const {
    page,
    pageNumber,
    rotation,
    scale,
    format,
    quality,
    background,
    output,
    timings,
    variant,
    postProcess,
  } = options;

  const resolvedFormat = format ?? "png";
  const viewport = page.getViewport({ scale, rotation });
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d", {
    alpha: background === "transparent",
  });
  if (!context) {
    throw new Error("Failed to get canvas context.");
  }

  const resolvedBackground =
    background === "transparent" && resolvedFormat === "jpeg"
      ? "#ffffff"
      : background;
  if (resolvedBackground !== "transparent") {
    context.save();
    context.fillStyle = resolvedBackground;
    context.fillRect(0, 0, viewport.width, viewport.height);
    context.restore();
  }

  const startRender = now();
  await page.render({ canvasContext: context, viewport }).promise;
  timings.render += now() - startRender;

  const startEncode = now();
  let payload = await encodeCanvas(canvas, resolvedFormat, quality, output);
  timings.encode += now() - startEncode;

  if (postProcess) {
    const processed = await postProcess(payload, {
      pageNumber,
      width: viewport.width,
      height: viewport.height,
      rotation: viewport.rotation,
      format: resolvedFormat,
      variant,
    });
    if (processed) {
      payload = processed;
    }
  }

  const result: PostProcessPayload = output.inMemory ? payload : {};

  return {
    pageNumber,
    width: viewport.width,
    height: viewport.height,
    rotation: viewport.rotation,
    blob: result.blob,
    bytes: result.bytes,
  };
}

function createCanvas(
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number | undefined,
  output: ReturnType<typeof normalizeBrowserOutput>
): Promise<PostProcessPayload> {
  const mime =
    format === "png"
      ? "image/png"
      : format === "webp"
        ? "image/webp"
        : "image/jpeg";
  const blob = await canvasToBlob(canvas, mime, quality);
  if (output.outputType === "bytes") {
    const buffer = await blob.arrayBuffer();
    return { bytes: new Uint8Array(buffer) };
  }
  return { blob };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode canvas."));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}
