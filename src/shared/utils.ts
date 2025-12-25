import { OutputFormat } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function resolveScale(scale?: number, dpi?: number): number {
  if (scale && scale > 0) {
    return scale;
  }
  if (dpi && dpi > 0) {
    return dpi / 72;
  }
  return 1;
}

export function resolveQuality(
  format: OutputFormat,
  quality?: number
): number | undefined {
  if (format === "png") {
    return undefined;
  }
  if (quality === undefined) {
    return 0.92;
  }
  return clamp(quality, 0, 1);
}

export function now(): number {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

export function normalizeRotation(rotation?: number): number {
  if (!rotation) {
    return 0;
  }
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}
