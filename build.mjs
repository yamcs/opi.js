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
