export type PageRange = "all" | number[] | string;

export type OutputFormat = "png" | "jpeg" | "webp";

export type OutputType = "blob" | "bytes";

export interface NamingOptions {
  pattern?: string;
  zeroPad?: number | "auto";
}

export interface ThumbnailOptions {
  scale?: number;
  dpi?: number;
  format?: OutputFormat;
  quality?: number;
  naming?: NamingOptions;
}

export interface CommonOptions {
  pages?: PageRange;
  format?: OutputFormat;
  quality?: number;
  scale?: number;
  dpi?: number;
  maxConcurrency?: number;
  background?: string;
  password?: string;
  pageRotation?: number;
  naming?: NamingOptions;
  thumbnails?: ThumbnailOptions;
  postProcess?: PostProcessHook;
}

export interface NodeOutputOptions {
  outputDir?: string;
  inMemory?: boolean;
}

export interface BrowserOutputOptions {
  inMemory?: boolean;
  outputType?: OutputType;
}

export interface NodeConvertOptions extends CommonOptions {
  output?: NodeOutputOptions;
}

export interface BrowserConvertOptions extends CommonOptions {
  output?: BrowserOutputOptions;
}

export interface ListPagesOptions {
  password?: string;
  scale?: number;
  dpi?: number;
  pageRotation?: number;
}

export interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

export interface RenderedPage extends PageInfo {
  filePath?: string;
  blob?: Blob;
  bytes?: Uint8Array;
}

export interface ConversionTimings {
  load: number;
  parse: number;
  render: number;
  encode: number;
  save: number;
}

export interface ConversionResult {
  pages: RenderedPage[];
  thumbnails?: RenderedPage[];
  totalPages: number;
  timings: ConversionTimings;
}

export interface PostProcessContext {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  format: OutputFormat;
  variant: "main" | "thumbnail";
}

export interface PostProcessPayload {
  bytes?: Uint8Array;
  blob?: Blob;
}

export type PostProcessHook = (
  payload: PostProcessPayload,
  context: PostProcessContext
) => Promise<PostProcessPayload | void> | PostProcessPayload | void;
