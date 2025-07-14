import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/queue.ts', 'src/jobs.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true
});
