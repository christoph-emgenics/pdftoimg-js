import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { promises as fs } from "fs";
import { join, resolve } from "path";

const fixturePath = resolve(__dirname, "../../fixtures/sample.pdf");
const outDir = resolve(__dirname, "dist");
const bundlePath = join(outDir, "bundle.js");
const browserEntry = resolve(__dirname, "../../src/browser.ts");

test.beforeAll(async () => {
  await fs.mkdir(outDir, { recursive: true });
  await build({
    entryPoints: [browserEntry],
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "PdfToImg",
    outfile: bundlePath,
    logLevel: "silent",
  });
});

test("converts a PDF in the browser", async ({ page }) => {
  const pdfBase64 = (await fs.readFile(fixturePath)).toString("base64");

  await page.goto("about:blank");
  await page.addScriptTag({ path: bundlePath });

  const result = await page.evaluate(async (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    const api = (window as any).PdfToImg;
    const pages = await api.listPages(bytes);
    const conversion = await api.convert(bytes, {
      format: "png",
      output: { outputType: "bytes" },
    });

    return {
      pageCount: pages.length,
      outputCount: conversion.pages.length,
      firstBytes: conversion.pages[0]?.bytes?.length ?? 0,
    };
  }, pdfBase64);

  expect(result.pageCount).toBeGreaterThan(0);
  expect(result.outputCount).toBeGreaterThan(0);
  expect(result.firstBytes).toBeGreaterThan(0);
});
