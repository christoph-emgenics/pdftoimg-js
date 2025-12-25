import { PdfToImgError } from "../shared/errors";

export interface CanvasModule {
  createCanvas: (width: number, height: number) => CanvasLike;
  ImageData?: typeof ImageData;
}

export interface CanvasLike {
  width: number;
  height: number;
  getContext: (
    type: "2d",
    options?: { alpha?: boolean },
  ) => CanvasRenderingContext2D | null;
  toBuffer: (mime?: string, options?: Record<string, unknown>) => Buffer;
}

export interface CanvasAdapter {
  module: CanvasModule;
  name: string;
}

export async function loadCanvasAdapter(): Promise<CanvasAdapter> {
  try {
    const mod = (await import("@napi-rs/canvas")) as unknown as CanvasModule;
    return { module: mod, name: "@napi-rs/canvas" };
  } catch {
    try {
      const mod = (await import("canvas")) as unknown as CanvasModule;
      return { module: mod, name: "canvas" };
    } catch {
      throw new PdfToImgError(
        "E_CANVAS",
        "No canvas adapter found. Install @napi-rs/canvas or canvas.",
      );
    }
  }
}

export function ensureImageData(adapter: CanvasAdapter) {
  if (adapter.module.ImageData && !(globalThis as any).ImageData) {
    (globalThis as any).ImageData = adapter.module.ImageData;
  }
}
