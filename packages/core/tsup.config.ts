import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/di.ts'],
    dts: true,
    target: 'es2022',
    format: ['esm']
});
