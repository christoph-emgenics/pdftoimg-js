import { NamingOptions, OutputFormat } from "./types";

export function resolveExtension(format: OutputFormat): string {
  if (format === "jpeg") {
    return "jpg";
  }
  return format;
}

export function formatPageNumber(
  pageNumber: number,
  totalPages: number,
  zeroPad?: number | "auto"
): string {
  const padLength =
    zeroPad === undefined || zeroPad === "auto"
      ? String(totalPages).length
      : Math.max(0, Math.trunc(zeroPad));
  const raw = String(pageNumber);
  return padLength > 0 ? raw.padStart(padLength, "0") : raw;
}

export function buildFileName(options: {
  basename: string;
  pageNumber: number;
  totalPages: number;
  format: OutputFormat;
  naming?: NamingOptions;
}): string {
  const { basename, pageNumber, totalPages, format, naming } = options;
  const pattern = naming?.pattern ?? "{basename}-p{page}.{ext}";
  const ext = resolveExtension(format);
  const padded = formatPageNumber(pageNumber, totalPages, naming?.zeroPad);

  return pattern
    .replaceAll("{basename}", basename)
    .replaceAll("{page}", padded)
    .replaceAll("{pageNumber}", String(pageNumber))
    .replaceAll("{ext}", ext);
}
