import { tanstackConfig } from '@tanstack/eslint-config';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import baseConfig from './base.js';
import reactCompilerConfig from './react-compiler.js';

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
const tanstackViteConfig = [
    {
        ignores: [
            ...(baseConfig[0].ignores ?? []),
            '**/eslint.config.js',
            '**/vite.config.ts'
        ]
    },
    ...baseConfig.filter((config) => !config.ignores),
    ...tanstackConfig.filter((config) => !config.plugins?.import),
    {
        files: ['**/*.{jsx,tsx}'], // IMPORTANT: Only apply to JSX/TSX files
        plugins: {
            react: pluginReact,
            'react-hooks': pluginReactHooks
        },
        languageOptions: {
            globals: {
                ...globals.browser // Use browser globals for React components
            }
        },
        settings: {
            react: {
                version: 'detect'
            }
        },
        rules: {
            ...pluginReact.configs.recommended.rules,
            ...pluginReactHooks.configs['recommended-latest'].rules,

            'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
            'react/prop-types': 'off' // Better handled by TypeScript
        }
    },
    ...reactCompilerConfig,
    eslintConfigPrettier
];

export default tanstackViteConfig;
