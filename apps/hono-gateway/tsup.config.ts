import { defineConfig } from 'tsup';

export default defineConfig([
    // Main runtime bundle
    {
        entry: ['src/index.ts'],
        format: ['esm'],
        dts: true,
        clean: true,
        sourcemap: true,
        treeshake: true
    },
    // Types only bundle for frontend consumption
    {
        entry: ['src/router.ts'],
        dts: {
            only: true
        },
        format: ['esm']
    }
]);
