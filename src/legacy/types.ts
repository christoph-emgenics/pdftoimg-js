import type { DocumentInitParameters, TypedArray } from "pdfjs-dist/types/src/display/api";

export type LegacyDocumentParams = Omit<DocumentInitParameters, "data" | "url">;

export type LegacyPagesType =
  | { startPage?: number; endPage?: number }
  | "firstPage"
  | "lastPage"
  | "all"
  | number
  | number[];

export interface LegacyOptions {
  imgType?: "png" | "jpg";
  scale?: number;
  background?: string | CanvasGradient | CanvasPattern | undefined;
  intent?: "display" | "print" | "any";
  pages?: LegacyPagesType;
  documentOptions?: LegacyDocumentParams;
  maxWidth?: number | null;
  maxHeight?: number | null;
  scaleForBrowserSupport?: boolean;
}

export type LegacyPdfSrc = string | URL | TypedArray | ArrayBuffer;

export type LegacyPerSrcReturn<O extends LegacyOptions> = O["pages"] extends
  | number
  | "firstPage"
  | "lastPage"
  ? string
  : string[];

export type LegacyReturn<
  O extends LegacyOptions,
  S extends LegacyPdfSrc | LegacyPdfSrc[],
> = S extends LegacyPdfSrc[] ? LegacyPerSrcReturn<O>[] : LegacyPerSrcReturn<O>;
