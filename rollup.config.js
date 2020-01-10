import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import serve from 'rollup-plugin-serve';
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
      objectHashIgnoreUnknownHack: true,
    }),
    terser({
      output: {
        comments: false
      }
    }),
    copy({
      targets: [
        { src: 'src/fonts', dest: 'dist' },
      ]
    }),
    serve({
      contentBase: '',
      port: 3000
    }),
  ],
  output: [
    {
      file: 'dist/webopi.umd.js',
      name: 'OPI',
      format: 'umd',
      sourcemap: true
    }, {
      file: 'dist/webopi.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  watch: {
    include: 'src/**',
  }
}
