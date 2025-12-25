import { convert, setPdfWorkerSrc } from "../../../src/browser";

setPdfWorkerSrc(
  new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString(),
);

const input = document.querySelector<HTMLInputElement>("#file");
const output = document.querySelector<HTMLDivElement>("#output");

if (!input || !output) {
  throw new Error("Missing DOM elements");
}

input.addEventListener("change", async () => {
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  output.innerHTML = "";
  const result = await convert(file, {
    format: "png",
    output: { outputType: "blob" },
  });

  for (const page of result.pages) {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(page.blob!);
    img.alt = `Page ${page.pageNumber}`;
    img.style.maxWidth = "100%";
    img.style.display = "block";
    img.style.marginBottom = "1rem";
    output.appendChild(img);
  }
});
