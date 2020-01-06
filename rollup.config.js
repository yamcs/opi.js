import serve from 'rollup-plugin-serve';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.ts',
  plugins: [
    typescript({
      useTsconfigDeclarationDir: true
    }),
    terser({
      output: {
        comments: false
      }
    }),
    serve({
      contentBase: 'example',
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
    }, {
      file: 'example/webopi.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  watch: {
    include: 'src/**',
  }
}
