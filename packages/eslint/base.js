import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import globals from "globals";
import importPlugin from "eslint-plugin-import";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const baseConfig = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/extensions": [
        "error",
        "never",
        {
          json: "always",
        },
      ],
    },
  },
//   {
//     plugins: {
//       onlyWarn,
//     },
//   },
  {
    ignores: ["dist/**"],
  },
];


/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const baseConfigWithoutImport = [
    js.configs.recommended,
    eslintConfigPrettier,
    ...tseslint.configs.strict,
    {
      languageOptions: {
        globals: {
          ...globals.node,
        },
      },
    },
    {
      plugins: {
        turbo: turboPlugin,
      },
      rules: {
        "turbo/no-undeclared-env-vars": "warn",
      },
    },
//   {
//     plugins: {
//       onlyWarn,
//     },
//   },
    {
      ignores: ["dist/**"],
    },
  ];
