import { ListPagesOptions, PageInfo } from "../shared/types";
import { normalizeRotation, resolveScale } from "../shared/utils";
import { BrowserInput, readBrowserInput } from "./input";
import { loadPdfDocument } from "./pdf";

export async function listPages(
  input: BrowserInput,
  options?: ListPagesOptions
): Promise<PageInfo[]> {
  const data = await readBrowserInput(input);
  const doc = await loadPdfDocument({
    data: data.data,
    url: data.url,
    password: options?.password,
  });
  const scale = resolveScale(options?.scale, options?.dpi);
  const rotation = normalizeRotation(options?.pageRotation);

  const pages: PageInfo[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({
      scale,
      rotation: (page.rotate + rotation) % 360,
    });
    pages.push({
      pageNumber,
      width: viewport.width,
      height: viewport.height,
      rotation: viewport.rotation,
    });
    page.cleanup();
  }

  await doc.destroy();
  return pages;
}
