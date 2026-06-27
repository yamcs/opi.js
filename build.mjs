import { build } from "esbuild";
import { copy } from "esbuild-plugin-copy";

await build({
  entryPoints: ["./src/index.ts"],
  outfile: "./dist/opi.js",
  sourcemap: true,
  bundle: true,
  platform: "browser",
  format: "esm",
  minify: true,
  plugins: [
    copy({
      resolveFrom: "cwd",
      assets: [
        {
          from: ["./src/fonts/*"],
          to: ["./dist/fonts"],
        },
        {
          from: ["./src/images/*"],
          to: ["./dist/images"],
        },
      ],
    }),
  ],
});

await build({
  entryPoints: ["./src/opi.standalone.ts"],
  outfile: "./dist/opi.standalone.js",
  sourcemap: false,
  bundle: true,
  platform: "browser",
  format: "iife",
  minify: true,
});
