import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [''],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true
});
