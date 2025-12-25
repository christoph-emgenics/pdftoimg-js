import { PageRange } from "./types";

function parseNumber(value: string, label: string): number {
  const num = Number.parseInt(value, 10);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`Invalid ${label} page number: ${value}`);
  }
  return num;
}

export function normalizePageRange(
  range: PageRange | undefined,
  totalPages: number
): number[] {
  if (!range || range === "all") {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();

  if (Array.isArray(range)) {
    for (const value of range) {
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`Invalid page number: ${value}`);
      }
      pages.add(Math.min(totalPages, Math.max(1, Math.trunc(value))));
    }
  } else if (typeof range === "string") {
    if (range.trim().toLowerCase() === "all") {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const segments = range.split(",").map((segment) => segment.trim());
    for (const segment of segments) {
      if (!segment) {
        continue;
      }
      if (segment.includes("-")) {
        const [rawStart, rawEnd] = segment.split("-");
        const start = rawStart ? parseNumber(rawStart, "start") : 1;
        const end = rawEnd ? parseNumber(rawEnd, "end") : totalPages;
        const rangeStart = Math.min(start, end);
        const rangeEnd = Math.max(start, end);
        for (let i = rangeStart; i <= rangeEnd; i += 1) {
          if (i >= 1 && i <= totalPages) {
            pages.add(i);
          }
        }
      } else {
        const page = parseNumber(segment, "page");
        if (page >= 1 && page <= totalPages) {
          pages.add(page);
        }
      }
    }
  } else {
    throw new Error("Unsupported page range type.");
  }

  return Array.from(pages).sort((a, b) => a - b);
}
