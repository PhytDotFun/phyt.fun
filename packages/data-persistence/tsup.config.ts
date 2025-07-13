import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/contracts/index.ts',
        'src/db/client.ts',
        'src/db/schema.ts',
        'src/db/models/users.ts',
        'src/redis/index.ts'
    ],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true
});
