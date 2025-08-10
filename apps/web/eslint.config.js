//  @ts-check

import tanstackViteConfig from '@phyt/eslint/tanstack';

/** @type {import("eslint").Linter.Config[]} */
export default [
    ...tanstackViteConfig,
    {
        // shadcn ui - can't be bothered to fix the linting on this
        ignores: [
            'src/components/ui/**/*',
            '*.gen.ts',
            'src/reportWebVitals.ts',
            'package.json'
        ]
    }
];
