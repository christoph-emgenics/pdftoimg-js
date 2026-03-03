export let workerSrc: string = "/assets/pdf.worker.min.mjs";

export function setPdfWorkerSrc(src: string) {
  if (src) {
    workerSrc = src;
  }
}

export async function loadPdfDocument(options: {
  data?: Uint8Array;
  url?: string;
  password?: string;
}) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  const task = pdfjsLib.getDocument({
    data: options.data,
    url: options.url,
    password: options.password,
  });
  const doc = await task.promise;
  return doc;
}
