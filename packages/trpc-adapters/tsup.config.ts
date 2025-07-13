import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/trpc.ts',
        'src/users/procedures.ts',
        'src/users/repository.ts',
        'src/users/service.ts'
    ],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true
});
