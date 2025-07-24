import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/idempotency.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true
});
