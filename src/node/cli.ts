import { join, parse } from "path";
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import { convert } from "./renderer";
import { listPages } from "./listPages";
import { buildFileName } from "../shared/naming";
import { normalizeCommonOptions } from "../shared/options";
import { createZipBuffer, writeZipToFile } from "./output";
import { PdfToImgError, asPdfError } from "../shared/errors";
import { OutputFormat } from "../shared/types";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .scriptName("pdftoimg")
    .usage("$0 <input> [options]")
    .positional("input", {
      type: "string",
      describe: "Path to the PDF file",
    })
    .option("out", {
      alias: "o",
      type: "string",
      describe: "Output directory",
    })
    .option("format", {
      choices: ["png", "jpeg", "webp"] as const,
      default: "png",
      describe: "Output image format",
    })
    .option("dpi", {
      type: "number",
      describe: "Render DPI (72 = 1x)",
    })
    .option("scale", {
      type: "number",
      describe: "Render scale (overrides DPI)",
    })
    .option("pages", {
      type: "string",
      describe: "Page range, e.g. 1-3,5,9-",
    })
    .option("concurrency", {
      type: "number",
      default: 4,
      describe: "Max concurrent page renders",
    })
    .option("quality", {
      type: "number",
      describe: "JPEG/WebP quality (0-1)",
    })
    .option("background", {
      type: "string",
      default: "transparent",
      describe: "Background color or transparent",
    })
    .option("password", {
      type: "string",
      describe: "Password for encrypted PDFs",
    })
    .option("rotation", {
      type: "number",
      default: 0,
      describe: "Additional rotation in degrees",
    })
    .option("list-pages", {
      type: "boolean",
      default: false,
      describe: "List page metadata instead of rendering",
    })
    .option("zip", {
      type: "boolean",
      default: false,
      describe: "Zip the output files",
    })
    .option("thumbs", {
      type: "string",
      describe: "Generate thumbnails (dpi or scale value)",
    })
    .option("stdout", {
      type: "boolean",
      default: false,
      describe: "Write output to stdout (zip for multi-page)",
    })
    .option("quiet", {
      type: "boolean",
      default: false,
      describe: "Suppress progress logs",
    })
    .option("json", {
      type: "boolean",
      default: false,
      describe: "Output JSON result",
    })
    .demandCommand(1)
    .help()
    .parse();

  const inputPath = String(argv._[0]);

  if (argv["list-pages"]) {
    const pages = await listPages(inputPath, {
      password: argv.password,
      scale: argv.scale,
      dpi: argv.dpi,
      pageRotation: argv.rotation,
    });

    if (argv.json) {
      process.stdout.write(JSON.stringify({ pages }, null, 2));
    } else {
      for (const page of pages) {
        console.log(
          `Page ${page.pageNumber}: ${Math.round(page.width)}x${Math.round(
            page.height,
          )} rot=${page.rotation}`,
        );
      }
    }
    return;
  }

  const thumbOptions = parseThumbs(argv.thumbs);
  const normalized = normalizeCommonOptions({
    pages: argv.pages ?? "all",
    format: argv.format as OutputFormat,
    quality: argv.quality,
    scale: argv.scale,
    dpi: argv.dpi,
    maxConcurrency: argv.concurrency,
    background: argv.background,
    password: argv.password,
    pageRotation: argv.rotation,
    thumbnails: thumbOptions ?? undefined,
  });

  const shouldZip = argv.zip || argv.stdout;
  const inMemory = shouldZip || argv.stdout;
  const outputDir = argv.stdout ? undefined : argv.out;

  let renderedCount = 0;
  const result = await convert(inputPath, {
    pages: normalized.pages,
    format: normalized.format,
    quality: normalized.quality,
    scale: argv.scale,
    dpi: argv.dpi,
    maxConcurrency: normalized.maxConcurrency,
    background: normalized.background,
    password: normalized.password,
    pageRotation: normalized.pageRotation,
    naming: normalized.naming,
    thumbnails: normalized.thumbnails,
    output: {
      outputDir,
      inMemory,
    },
    postProcess:
      argv.quiet || argv.json
        ? undefined
        : (payload, ctx) => {
            if (ctx.variant === "main") {
              renderedCount += 1;
              console.log(`Rendered ${renderedCount} page(s)`);
            }
            return payload;
          },
  });

  if (argv.stdout) {
    await writeStdout(result, inputPath, normalized);
    return;
  }

  if (shouldZip) {
    const zipPath = await writeZip(result, inputPath, normalized, argv.out);
    if (!argv.quiet && !argv.json) {
      console.log(`Wrote zip: ${zipPath}`);
    }
  }

  if (argv.json) {
    const summary = {
      totalPages: result.totalPages,
      pages: result.pages.map((page) => ({
        pageNumber: page.pageNumber,
        width: page.width,
        height: page.height,
        rotation: page.rotation,
        filePath: page.filePath,
      })),
      thumbnails: result.thumbnails?.map((page) => ({
        pageNumber: page.pageNumber,
        width: page.width,
        height: page.height,
        rotation: page.rotation,
        filePath: page.filePath,
      })),
      timings: result.timings,
    };
    process.stdout.write(JSON.stringify(summary, null, 2));
    return;
  }

  if (!argv.quiet) {
    console.log(
      `Converted ${result.pages.length} page(s) in ${Math.round(
        result.timings.render + result.timings.encode,
      )}ms`,
    );
  }
}

function parseThumbs(input: string | undefined) {
  if (!input) {
    return undefined;
  }
  const value = Number.parseFloat(input);
  if (!Number.isFinite(value) || value <= 0) {
    throw new PdfToImgError("E_OPTIONS", "Invalid --thumbs value.");
  }
  if (value <= 10) {
    return { scale: value };
  }
  return { dpi: value };
}

async function writeStdout(
  result: Awaited<ReturnType<typeof convert>>,
  inputPath: string,
  normalized: ReturnType<typeof normalizeCommonOptions>,
) {
  const entries = collectZipEntries(result, inputPath, normalized);
  if (entries.length === 1) {
    process.stdout.write(Buffer.from(entries[0].bytes));
    return;
  }
  const zip = await createZipBuffer(entries);
  process.stdout.write(zip);
}

async function writeZip(
  result: Awaited<ReturnType<typeof convert>>,
  inputPath: string,
  normalized: ReturnType<typeof normalizeCommonOptions>,
  outputDir?: string,
) {
  const entries = collectZipEntries(result, inputPath, normalized);
  const zipName = `${parse(inputPath).name}.zip`;
  const outputPath = outputDir ? join(outputDir, zipName) : zipName;
  return writeZipToFile(outputPath, entries);
}

function collectZipEntries(
  result: Awaited<ReturnType<typeof convert>>,
  inputPath: string,
  normalized: ReturnType<typeof normalizeCommonOptions>,
) {
  const base = parse(inputPath).name;
  const entries = result.pages.map((page) => {
    if (!page.bytes) {
      throw new PdfToImgError(
        "E_OUTPUT",
        "In-memory output is required for zip/stdout.",
      );
    }
    return {
      name: buildFileName({
        basename: base,
        pageNumber: page.pageNumber,
        totalPages: result.totalPages,
        format: normalized.format,
        naming: normalized.naming,
      }),
      bytes: page.bytes,
    };
  });

  if (result.thumbnails && normalized.thumbnails) {
    for (const page of result.thumbnails) {
      if (!page.bytes) {
        throw new PdfToImgError(
          "E_OUTPUT",
          "In-memory output is required for zip/stdout.",
        );
      }
      entries.push({
        name: buildFileName({
          basename: base,
          pageNumber: page.pageNumber,
          totalPages: result.totalPages,
          format: normalized.thumbnails.format,
          naming: normalized.thumbnails.naming,
        }),
        bytes: page.bytes,
      });
    }
  }

  return entries;
}

main().catch((err) => {
  const error = asPdfError(err);
  const wantsJson = process.argv.includes("--json");
  if (wantsJson) {
    const payload = { error: { code: error.code, message: error.message } };
    process.stderr.write(JSON.stringify(payload, null, 2));
  } else {
    process.stderr.write(`Error (${error.code}): ${error.message}\n`);
  }
  process.exit(1);
});
