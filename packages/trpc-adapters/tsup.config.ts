import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/trpc.ts',
        'src/di.ts',
        'src/users/procedures.ts',
        'src/posts/procedures.ts',
        'src/runs/procedures.ts',
        'src/encoder.ts'
    ],
    format: ['esm'],
    target: 'node20',
    platform: 'node',
    outDir: 'dist',
    dts: true,
    clean: true,
    minify: true,
    splitting: false,
    sourcemap: false
});
