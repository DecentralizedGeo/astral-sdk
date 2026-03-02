import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/location/index.ts', 'src/compute/index.ts', 'src/plugins/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  platform: 'neutral',
  shims: false,
  // Node built-ins used by unix-location plugin — mark as external so they
  // are not bundled and resolve correctly at runtime in Node environments.
  external: ['child_process', 'util'],
});
