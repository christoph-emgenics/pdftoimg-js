import { describe, expect, it } from "vitest";
import { buildFileName, formatPageNumber } from "../../src/shared/naming";

describe("naming", () => {
  it("pads page numbers by total pages", () => {
    expect(formatPageNumber(2, 120)).toBe("002");
  });

  it("builds file names with pattern", () => {
    const name = buildFileName({
      basename: "sample",
      pageNumber: 3,
      totalPages: 12,
      format: "png",
      naming: { pattern: "{basename}-{page}.{ext}", zeroPad: 2 },
    });
    expect(name).toBe("sample-03.png");
  });
});
