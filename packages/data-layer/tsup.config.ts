import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/db/index.ts', 'src/redis/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true
});
