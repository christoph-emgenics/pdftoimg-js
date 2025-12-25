import { describe, expect, it } from "vitest";
import {
  normalizeLegacyOptions,
  resolveLegacyPages,
  resolveLegacyScale,
  shouldReturnSingle,
} from "../../src/legacy/shared";

describe("normalizeLegacyOptions", () => {
  it("applies defaults when no options provided", () => {
    const opts = normalizeLegacyOptions(undefined);
    expect(opts.imgType).toBe("png");
    expect(opts.scale).toBe(1);
    expect(opts.background).toBe("rgb(255,255,255)");
    expect(opts.intent).toBe("display");
    expect(opts.pages).toBe("all");
    expect(opts.maxWidth).toBeNull();
    expect(opts.maxHeight).toBeNull();
    expect(opts.scaleForBrowserSupport).toBe(false);
  });

  it("preserves provided options", () => {
    const opts = normalizeLegacyOptions({
      imgType: "jpg",
      scale: 2,
      pages: "firstPage",
      maxWidth: 800,
    });
    expect(opts.imgType).toBe("jpg");
    expect(opts.scale).toBe(2);
    expect(opts.pages).toBe("firstPage");
    expect(opts.maxWidth).toBe(800);
  });
});

describe("resolveLegacyPages", () => {
  it("returns first page for 'firstPage'", () => {
    expect(resolveLegacyPages("firstPage", 10)).toEqual([1]);
  });

  it("returns last page for 'lastPage'", () => {
    expect(resolveLegacyPages("lastPage", 10)).toEqual([10]);
  });

  it("returns single page for number", () => {
    expect(resolveLegacyPages(3, 10)).toEqual([3]);
  });

  it("returns array of pages for number array", () => {
    expect(resolveLegacyPages([1, 3, 5], 10)).toEqual([1, 3, 5]);
  });

  it("returns range for startPage/endPage object", () => {
    expect(resolveLegacyPages({ startPage: 2, endPage: 4 }, 10)).toEqual([
      2, 3, 4,
    ]);
  });

  it("returns all pages for 'all'", () => {
    expect(resolveLegacyPages("all", 3)).toEqual([1, 2, 3]);
  });

  it("defaults to all pages for object without range", () => {
    expect(resolveLegacyPages({}, 3)).toEqual([1, 2, 3]);
  });
});

describe("resolveLegacyScale", () => {
  it("returns base scale when no constraints", () => {
    const opts = normalizeLegacyOptions({});
    expect(resolveLegacyScale(2, 500, 500, opts)).toBe(2);
  });

  it("reduces scale when maxWidth is exceeded", () => {
    const opts = normalizeLegacyOptions({ maxWidth: 250, scaleForBrowserSupport: true });
    const result = resolveLegacyScale(1, 500, 500, opts);
    expect(result).toBe(0.5);
  });

  it("reduces scale when maxHeight is exceeded", () => {
    const opts = normalizeLegacyOptions({ maxHeight: 200, scaleForBrowserSupport: true });
    const result = resolveLegacyScale(1, 400, 800, opts);
    expect(result).toBe(0.25);
  });

  it("applies browser support scaling with defaults", () => {
    const opts = normalizeLegacyOptions({ scaleForBrowserSupport: true });
    // 4096 defaults, so 8192 width would be scaled by 0.5
    const result = resolveLegacyScale(1, 8192, 4096, opts);
    expect(result).toBe(0.5);
  });
});

describe("shouldReturnSingle", () => {
  it("returns true for 'firstPage'", () => {
    expect(shouldReturnSingle("firstPage")).toBe(true);
  });

  it("returns true for 'lastPage'", () => {
    expect(shouldReturnSingle("lastPage")).toBe(true);
  });

  it("returns true for number", () => {
    expect(shouldReturnSingle(5)).toBe(true);
  });

  it("returns false for 'all'", () => {
    expect(shouldReturnSingle("all")).toBe(false);
  });

  it("returns false for array", () => {
    expect(shouldReturnSingle([1, 2])).toBe(false);
  });

  it("returns false for range object", () => {
    expect(shouldReturnSingle({ startPage: 1, endPage: 3 })).toBe(false);
  });
});
