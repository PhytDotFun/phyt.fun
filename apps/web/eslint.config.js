//  @ts-check

import { tanstackConfigJs } from '@phyt/eslint/tanstack';

/** @type {import("eslint").Linter.Config[]} */
export default [
    ...tanstackConfigJs,
    {
        ignores: ['src/components/ui/**/*']
    }
];
