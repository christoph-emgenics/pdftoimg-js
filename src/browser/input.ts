import { PdfToImgError } from "../shared/errors";

export type BrowserInput =
  | string
  | URL
  | File
  | Blob
  | ArrayBuffer
  | Uint8Array;

export interface BrowserInputData {
  data?: Uint8Array;
  url?: string;
  basename: string;
}

export async function readBrowserInput(
  input: BrowserInput
): Promise<BrowserInputData> {
  if (typeof input === "string" || input instanceof URL) {
    const url = input.toString();
    const basename = extractBasename(url);
    return { url, basename };
  }

  if (input instanceof ArrayBuffer) {
    const copy = input.slice(0);
    return { data: new Uint8Array(copy), basename: "document" };
  }

  if (input instanceof Uint8Array) {
    return { data: input.slice(), basename: "document" };
  }

  if (input instanceof Blob) {
    const buffer = new Uint8Array(await input.arrayBuffer());
    const name = "name" in input ? (input as File).name : undefined;
    return { data: buffer, basename: stripExtension(name ?? "document") };
  }

  throw new PdfToImgError("E_INPUT", "Unsupported browser input type.");
}

function extractBasename(url: string): string {
  try {
    const parsed = new URL(url, typeof window !== "undefined" ? window.location.href : undefined);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "document";
    return stripExtension(last);
  } catch {
    return stripExtension(url.split("/").pop() || "document");
  }
}

function stripExtension(value: string): string {
  const idx = value.lastIndexOf(".");
  if (idx <= 0) {
    return value;
  }
  return value.slice(0, idx);
}
