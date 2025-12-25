import {
  ConversionResult,
  NodeConvertOptions,
  PostProcessPayload,
  RenderedPage,
} from "../shared/types";
import { normalizeCommonOptions, normalizeNodeOutput } from "../shared/options";
import { normalizePageRange } from "../shared/range";
import { buildFileName } from "../shared/naming";
import { createLimiter } from "../shared/limiter";
import { now } from "../shared/utils";
import { readNodeInput, NodeInput } from "./input";
import { loadPdfDocument } from "./pdf";
import { ensureImageData, loadCanvasAdapter } from "./canvas";
import { writeFileToDir } from "./output";

export async function convert(
  input: NodeInput,
  options?: NodeConvertOptions,
): Promise<ConversionResult> {
  const timings = { load: 0, parse: 0, render: 0, encode: 0, save: 0 };
  const startLoad = now();
  const inputData = await readNodeInput(input);
  timings.load = now() - startLoad;

  const normalized = normalizeCommonOptions(options);
  const output = normalizeNodeOutput(options?.output);

  const startParse = now();
  const doc = await loadPdfDocument(inputData.data, {
    password: normalized.password,
  });
  timings.parse = now() - startParse;

  const totalPages = doc.numPages;
  const pages = normalizePageRange(normalized.pages, totalPages);
  const limiter = createLimiter(normalized.maxConcurrency);
  const adapter = await loadCanvasAdapter();
  ensureImageData(adapter);

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
        basename: inputData.basename,
        naming: normalized.naming,
        totalPages,
        outputDir: output.outputDir,
        inMemory: output.inMemory,
        adapter,
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
          basename: inputData.basename,
          naming: normalized.thumbnails.naming,
          totalPages,
          outputDir: output.outputDir,
          inMemory: output.inMemory,
          adapter,
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
    .filter((v) => typeof v != "undefined")
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
  format: NodeConvertOptions["format"];
  quality?: number;
  background: string;
  basename: string;
  naming: NodeConvertOptions["naming"];
  totalPages: number;
  outputDir?: string;
  inMemory: boolean;
  adapter: Awaited<ReturnType<typeof loadCanvasAdapter>>;
  timings: { render: number; encode: number; save: number };
  variant: "main" | "thumbnail";
  postProcess?: NodeConvertOptions["postProcess"];
}): Promise<RenderedPage> {
  const {
    page,
    pageNumber,
    rotation,
    scale,
    format,
    quality,
    background,
    basename,
    naming,
    totalPages,
    outputDir,
    inMemory,
    adapter,
    timings,
    variant,
    postProcess,
  } = options;

  const resolvedFormat = format ?? "png";
  const viewport = page.getViewport({ scale, rotation });
  const canvas = adapter.module.createCanvas(viewport.width, viewport.height);
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
  let bytes = encodeCanvas(canvas, resolvedFormat, quality);
  timings.encode += now() - startEncode;

  if (postProcess) {
    const processed = await postProcess(
      { bytes },
      {
        pageNumber,
        width: viewport.width,
        height: viewport.height,
        rotation: viewport.rotation,
        format: resolvedFormat,
        variant,
      },
    );
    if (processed?.bytes) {
      bytes = processed.bytes;
    }
  }

  let filePath: string | undefined;
  if (outputDir) {
    const fileName = buildFileName({
      basename,
      pageNumber,
      totalPages,
      format: resolvedFormat,
      naming,
    });
    const startSave = now();
    filePath = await writeFileToDir(outputDir, fileName, bytes);
    timings.save += now() - startSave;
  }

  const payload: PostProcessPayload = inMemory ? { bytes } : {};

  return {
    pageNumber,
    width: viewport.width,
    height: viewport.height,
    rotation: viewport.rotation,
    filePath,
    bytes: payload.bytes,
  };
}

function encodeCanvas(
  canvas: {
    toBuffer: (mime?: string, options?: Record<string, unknown>) => Buffer;
  },
  format: string,
  quality?: number,
): Uint8Array {
  if (format === "png") {
    return canvas.toBuffer("image/png");
  }
  if (format === "webp") {
    return canvas.toBuffer("image/webp", quality ? { quality } : undefined);
  }
  return canvas.toBuffer("image/jpeg", quality ? { quality } : undefined);
}
