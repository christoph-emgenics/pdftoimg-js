export { convert } from "./browser/renderer";
export { listPages } from "./browser/listPages";
export { setPdfWorkerSrc } from "./browser/pdf";
export { pdfToImg, singlePdfToImg } from "./legacy/browser";
export type {
  ConversionResult,
  ConversionTimings,
  PageInfo,
  RenderedPage,
  BrowserConvertOptions,
  ListPagesOptions,
  NamingOptions,
  PageRange,
  OutputFormat,
  ThumbnailOptions,
} from "./shared/types";
export type { BrowserInput } from "./browser/input";
export type {
  LegacyDocumentParams,
  LegacyOptions,
  LegacyPagesType,
  LegacyPdfSrc,
} from "./legacy/types";
