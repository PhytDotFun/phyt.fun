import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node20',
    platform: 'node',
    outDir: 'dist',
    dts: true,
    clean: true,
    minify: true,
    splitting: false,
    sourcemap: true
});
