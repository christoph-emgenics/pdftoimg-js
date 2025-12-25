import { describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { fileURLToPath } from "url";
import { convert, listPages } from "../../src/index";

const fixturePath = fileURLToPath(
  new URL("../../fixtures/sample.pdf", import.meta.url),
);

describe("node integration", () => {
  it("converts a PDF and writes files", async () => {
    const outputDir = await fs.mkdtemp(join(tmpdir(), "pdftoimg-"));
    const result = await convert(fixturePath, {
      format: "png",
      output: { outputDir },
    });

    expect(result.pages.length).toBeGreaterThan(0);

    for (const page of result.pages) {
      expect(page.filePath).toBeTruthy();
      const stat = await fs.stat(page.filePath as string);
      expect(stat.size).toBeGreaterThan(0);
    }
  });

  it("lists page metadata", async () => {
    const pages = await listPages(fixturePath);
    expect(pages.length).toBeGreaterThan(0);
    expect(pages[0].width).toBeGreaterThan(0);
  });
});
