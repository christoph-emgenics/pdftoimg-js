export { convert } from "./node/renderer";
export { listPages } from "./node/listPages";
export { pdfToImg, singlePdfToImg } from "./legacy/node";
export type {
  ConversionResult,
  ConversionTimings,
  PageInfo,
  RenderedPage,
  NodeConvertOptions,
  ListPagesOptions,
  NamingOptions,
  PageRange,
  OutputFormat,
  ThumbnailOptions,
} from "./shared/types";
export type { NodeInput } from "./node/input";
export type {
  LegacyDocumentParams,
  LegacyOptions,
  LegacyPagesType,
  LegacyPdfSrc,
} from "./legacy/types";
