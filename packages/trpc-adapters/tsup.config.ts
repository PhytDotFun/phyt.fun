import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/trpc.ts',
        'src/di.ts',
        'src/users/procedures.ts',
        'src/posts/procedures.ts',
        'src/encoder.ts'
    ],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true
});
