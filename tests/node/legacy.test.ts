import { describe, expect, it } from "vitest";
import { fileURLToPath } from "url";
import { pdfToImg, singlePdfToImg } from "../../src/index";

const fixturePath = fileURLToPath(
  new URL("../../fixtures/sample.pdf", import.meta.url),
);

describe("legacy node integration", () => {
  describe("singlePdfToImg", () => {
    it("converts all pages by default", async () => {
      const result = await singlePdfToImg(fixturePath);
      expect(Array.isArray(result)).toBe(true);
      expect((result as string[]).length).toBeGreaterThan(0);
      for (const dataUrl of result as string[]) {
        expect(dataUrl).toMatch(/^data:image\/png;base64,/);
      }
    });

    it("returns single string for firstPage", async () => {
      const result = await singlePdfToImg(fixturePath, { pages: "firstPage" });
      expect(typeof result).toBe("string");
      expect(result as string).toMatch(/^data:image\/png;base64,/);
    });

    it("returns single string for lastPage", async () => {
      const result = await singlePdfToImg(fixturePath, { pages: "lastPage" });
      expect(typeof result).toBe("string");
      expect(result as string).toMatch(/^data:image\/png;base64,/);
    });

    it("returns single string for specific page number", async () => {
      const result = await singlePdfToImg(fixturePath, { pages: 1 });
      expect(typeof result).toBe("string");
      expect(result as string).toMatch(/^data:image\/png;base64,/);
    });

    it("supports jpg output", async () => {
      const result = await singlePdfToImg(fixturePath, {
        pages: "firstPage",
        imgType: "jpg",
      });
      expect(typeof result).toBe("string");
      expect(result as string).toMatch(/^data:image\/jpeg;base64,/);
    });

    it("supports page range object", async () => {
      const result = await singlePdfToImg(fixturePath, {
        pages: { startPage: 1, endPage: 1 },
      });
      expect(Array.isArray(result)).toBe(true);
      expect((result as string[]).length).toBe(1);
    });

    it("supports scale option", async () => {
      const result = await singlePdfToImg(fixturePath, {
        pages: "firstPage",
        scale: 0.5,
      });
      expect(typeof result).toBe("string");
      expect(result as string).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("pdfToImg", () => {
    it("converts single source", async () => {
      const result = await pdfToImg(fixturePath, { pages: "firstPage" });
      expect(typeof result).toBe("string");
      expect(result as string).toMatch(/^data:image\/png;base64,/);
    });

    it("converts array of sources", async () => {
      const result = await pdfToImg([fixturePath, fixturePath], {
        pages: "firstPage",
      });
      expect(Array.isArray(result)).toBe(true);
      expect((result as string[]).length).toBe(2);
      for (const dataUrl of result as string[]) {
        expect(dataUrl).toMatch(/^data:image\/png;base64,/);
      }
    });
  });
});
