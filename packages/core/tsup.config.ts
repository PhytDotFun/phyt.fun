import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/env.ts',
        'src/logger.ts',
        'src/constants/ui.ts',
        'src/types/api.ts',
        'src/types/ui.ts',
        'src/validation/users.ts'
    ],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true
});
