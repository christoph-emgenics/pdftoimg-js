import { describe, expect, it } from "vitest";
import { normalizePageRange } from "../../src/shared/range";

describe("normalizePageRange", () => {
  it("returns all pages by default", () => {
    expect(normalizePageRange(undefined, 3)).toEqual([1, 2, 3]);
  });

  it("parses explicit ranges", () => {
    expect(normalizePageRange("1-3,5,9-", 12)).toEqual([
      1, 2, 3, 5, 9, 10, 11, 12,
    ]);
  });

  it("accepts string all", () => {
    expect(normalizePageRange("all", 4)).toEqual([1, 2, 3, 4]);
  });

  it("handles reversed ranges", () => {
    expect(normalizePageRange("4-2", 5)).toEqual([2, 3, 4]);
  });

  it("accepts arrays", () => {
    expect(normalizePageRange([3, 1, 2, 2], 4)).toEqual([1, 2, 3]);
  });
});
