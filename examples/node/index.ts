import path from "path";
import { convert, listPages } from "../../src/index";

async function run() {
  const pages = await listPages(path.join(__dirname, "../../fixtures/sample.pdf"));
  console.log(`Pages: ${pages.length}`);

  const result = await convert(path.join(__dirname, "../../fixtures/sample.pdf"), {
    format: "png",
    pages: "1-2",
    output: { outputDir: "./out" },
  });

  console.log(result.pages.map((page) => page.filePath));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
