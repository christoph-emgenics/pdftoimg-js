import { describe, expect, it } from "vitest";
import { normalizeCommonOptions, normalizeNodeOutput } from "../../src/shared/options";

describe("normalizeCommonOptions", () => {
  it("applies defaults", () => {
    const opts = normalizeCommonOptions(undefined);
    expect(opts.format).toBe("png");
    expect(opts.scale).toBe(1);
    expect(opts.maxConcurrency).toBe(4);
    expect(opts.background).toBe("transparent");
  });

  it("normalizes thumbnails", () => {
    const opts = normalizeCommonOptions({
      thumbnails: { dpi: 144 },
    });
    expect(opts.thumbnails?.scale).toBe(2);
  });
});

describe("normalizeNodeOutput", () => {
  it("defaults outputDir when not in memory", () => {
    const output = normalizeNodeOutput(undefined);
    expect(output.outputDir).toBe("output");
    expect(output.inMemory).toBe(false);
  });

  it("keeps outputDir undefined when in memory", () => {
    const output = normalizeNodeOutput({ inMemory: true });
    expect(output.outputDir).toBeUndefined();
    expect(output.inMemory).toBe(true);
  });
});
