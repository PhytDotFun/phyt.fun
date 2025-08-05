import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/db/client.ts',
        'src/db/schema.ts',
        'src/models/users.ts',
        'src/models/posts.ts',
        'src/models/runs.ts'
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
