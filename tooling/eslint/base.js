import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
const baseConfig = [
    {
        ignores: ['**/eslint.config.js', '**/tsup.config.ts']
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked.map((config) => ({
        ...config,
        files: ['**/*.{ts,tsx}']
    })),
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: ['./tsconfig.json']
            }
        },
        rules: {
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
            ]
        }
    },
    {
        plugins: {
            import: importPlugin
        },
        settings: {
            'import/resolver': {
                typescript: {
                    project: './tsconfig.json',
                    alwaysTryTypes: true
                },
                node: true
            }
        },
        rules: {
            'import/order': [
                'error',
                {
                    'newlines-between': 'always',
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index'
                    ]
                }
            ],
            'import/extensions': [
                'error',
                'ignorePackages',
                {
                    js: 'never',
                    jsx: 'never',
                    ts: 'never',
                    tsx: 'never',
                    json: 'always'
                }
            ]
            // 'import/no-relative-parent-imports': [
            //     'error',
            //     {
            //         ignore: ['^@/'] // Still throwing linting error with path alias
            //     }
            // ]
        }
    },
    {
        files: ['**/*.js', '**/*.cjs'],
        languageOptions: {
            globals: {
                ...globals.node
            }
        }
    },
    {
        plugins: {
            turbo: turboPlugin
        },
        rules: {
            'turbo/no-undeclared-env-vars': 'warn'
        }
    },
    //   {
    //     plugins: {
    //       onlyWarn,
    //     },
    //   },
    {
        ignores: ['dist/**']
    },
    eslintConfigPrettier
];

export default baseConfig;
