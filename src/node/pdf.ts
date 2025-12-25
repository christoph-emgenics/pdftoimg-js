
export const BASE_DIR = process.cwd();
export const CMAP_URL = "node_modules/pdfjs-dist/cmaps/";
export const STANDARD_FONT_DATA_URL = "node_modules/pdfjs-dist/standard_fonts/";

export interface PdfLoadOptions {
  password?: string;
}

export async function loadPdfDocument(
  data: Uint8Array,
  options?: PdfLoadOptions,
) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjsLib.getDocument({
    data,
    password: options?.password,
    useSystemFonts: true,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
  });
  const doc = await task.promise;
  return doc;
}
