import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  plugins: [
    // resolve and commonJS are used to allow ES6 importing of fontfaceobserver
    // we prefer not to use the 'standalone' version, because it adds to the window object.
    resolve(),
    commonjs({
      include: 'node_modules/**'
    }),
    typescript({
      useTsconfigDeclarationDir: true,
    }),
    terser({
      output: {
        comments: false
      }
    }),
    copy({
      targets: [
        { src: 'src/fonts', dest: 'dist' }
      ]
    })
  ],
  output: [
    {
      file: 'dist/opi.umd.js',
      name: 'opi',
      format: 'umd',
      sourcemap: true
    }, {
      file: 'dist/opi.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  watch: {
    include: 'src/**',
  }
}
