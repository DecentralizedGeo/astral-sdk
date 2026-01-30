import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/location/index.ts',
    'src/compute/index.ts',
    'src/offchain/index.ts',
    'src/onchain/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  platform: 'neutral',
  shims: false,
});
