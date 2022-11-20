import terser from "@rollup/plugin-terser";
import copy from "rollup-plugin-copy";
import typescript from "rollup-plugin-typescript2";

export default {
  input: "src/index.ts",
  plugins: [
    typescript({
      useTsconfigDeclarationDir: true,
    }),
    terser({
      output: {
        comments: false,
      },
    }),
    copy({
      targets: [
        { src: "src/fonts", dest: "dist" },
        { src: "src/images", dest: "dist" },
      ],
    }),
  ],
  output: [
    {
      file: "dist/opi.js",
      format: "esm",
      sourcemap: true,
    },
  ],
  watch: {
    include: "src/**",
  },
};
