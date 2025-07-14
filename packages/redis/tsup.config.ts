import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/client.ts', 'src/cache.ts', 'src/bull.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true
});
