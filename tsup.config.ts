import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    clean: true,
    minify: false,
    platform: "node",
    target: "node18",
    outDir: "dist",
    external: ["pdfjs-dist", "yargs", "yazl", "@napi-rs/canvas", "canvas"],
  },
  {
    entry: ["src/browser.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    clean: false,
    minify: false,
    platform: "browser",
    target: "es2020",
    outDir: "dist",
    external: ["pdfjs-dist"],
  },
  {
    entry: ["src/node/cli.ts"],
    format: ["cjs"],
    splitting: false,
    clean: false,
    minify: false,
    platform: "node",
    target: "node18",
    outDir: "dist",
    banner: {
      js: "#!/usr/bin/env node",
    },
    external: ["pdfjs-dist", "yargs", "yazl", "@napi-rs/canvas", "canvas"],
  },
]);
