import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/db/client.ts',
        'src/db/schema.ts',
        'src/models/users.ts',
        'src/models/posts.ts'
    ],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true
});
