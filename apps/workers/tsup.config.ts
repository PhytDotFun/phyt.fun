import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    bundle: true,
    external: [], // Bundle everything
    platform: 'node',
    target: 'node18'
});
