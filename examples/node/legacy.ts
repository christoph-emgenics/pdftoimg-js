/**
 * Legacy API Example
 *
 * Demonstrates the backward-compatible pdfToImg and singlePdfToImg methods
 * that return base64-encoded data URLs.
 */

import { promises as fs } from "fs";
import path, { join } from "path";
import { pdfToImg, singlePdfToImg } from "../../src/index";

const PDF_PATH = path.join(__dirname, "../../fixtures/sample.pdf");
const OUTPUT_DIR = "./legacy-out";

async function ensureOutputDir() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(",")[1];
  return Buffer.from(base64, "base64");
}

async function basicExample() {
  console.log("=== Basic Example ===");

  // Convert first page to PNG (default)
  const image = await pdfToImg(PDF_PATH, {
    pages: "firstPage",
  });

  // Save the image
  const buffer = dataUrlToBuffer(image as string);
  const outputPath = join(OUTPUT_DIR, "basic-first-page.png");
  await fs.writeFile(outputPath, buffer);
  console.log(`Saved: ${outputPath}`);
}

async function jpgExample() {
  console.log("\n=== JPG Example ===");

  // Convert with JPG format
  const image = await singlePdfToImg(PDF_PATH, {
    pages: "firstPage",
    imgType: "jpg",
    scale: 1.5,
    background: "white",
  });

  const buffer = dataUrlToBuffer(image as string);
  const outputPath = join(OUTPUT_DIR, "scaled-first-page.jpg");
  await fs.writeFile(outputPath, buffer);
  console.log(`Saved: ${outputPath}`);
}

async function pageRangeExample() {
  console.log("\n=== Page Range Example ===");

  // Convert specific page range
  const images = await singlePdfToImg(PDF_PATH, {
    pages: { startPage: 1, endPage: 2 },
    imgType: "png",
    scale: 0.5,
  });

  for (let i = 0; i < (images as string[]).length; i++) {
    const buffer = dataUrlToBuffer((images as string[])[i]);
    const outputPath = join(OUTPUT_DIR, `page-${i + 1}-thumb.png`);
    await fs.writeFile(outputPath, buffer);
    console.log(`Saved: ${outputPath}`);
  }
}

async function specialPagesExample() {
  console.log("\n=== Special Pages Example ===");

  // First page
  const firstPage = await pdfToImg(PDF_PATH, { pages: "firstPage" });
  await fs.writeFile(
    join(OUTPUT_DIR, "first-page.png"),
    dataUrlToBuffer(firstPage as string),
  );
  console.log("Saved: first-page.png");

  // Last page
  const lastPage = await pdfToImg(PDF_PATH, { pages: "lastPage" });
  await fs.writeFile(
    join(OUTPUT_DIR, "last-page.png"),
    dataUrlToBuffer(lastPage as string),
  );
  console.log("Saved: last-page.png");

  // Specific page number
  const page1 = await pdfToImg(PDF_PATH, { pages: 1 });
  await fs.writeFile(
    join(OUTPUT_DIR, "specific-page-1.png"),
    dataUrlToBuffer(page1 as string),
  );
  console.log("Saved: specific-page-1.png");
}

async function run() {
  await ensureOutputDir();
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  await basicExample();
  await jpgExample();
  await pageRangeExample();
  await specialPagesExample();

  console.log("\n✓ All examples completed!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
