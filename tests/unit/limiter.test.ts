import { describe, expect, it } from "vitest";
import { createLimiter } from "../../src/shared/limiter";

describe("createLimiter", () => {
  it("respects max concurrency", async () => {
    const limit = createLimiter(2);
    let active = 0;
    let max = 0;

    await Promise.all(
      Array.from({ length: 6 }, () =>
        limit(async () => {
          active += 1;
          max = Math.max(max, active);
          await new Promise((resolve) => setTimeout(resolve, 10));
          active -= 1;
        })
      )
    );

    expect(max).toBeLessThanOrEqual(2);
  });
});
