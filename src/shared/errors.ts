export class PdfToImgError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PdfToImgError";
    this.code = code;
  }
}

export function asPdfError(err: unknown, fallbackCode = "E_UNKNOWN"): PdfToImgError {
  if (err instanceof PdfToImgError) {
    return err;
  }
  const message = err instanceof Error ? err.message : String(err);
  return new PdfToImgError(fallbackCode, message);
}
