const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const prettierPlugin = require("eslint-plugin-prettier");
const prettierConfig = require("eslint-config-prettier");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["renderer/src/**/*.ts", "renderer/src/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: "module",
        project: "./renderer/tsconfig.json",
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      "prettier/prettier": ["error", { endOfLine: "auto" }],
      "@typescript-eslint/no-explicit-any": "off",
      "no-prototype-builtins": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-case-declarations": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "no-unsafe-optional-chaining": "warn",
      "no-self-assign": "warn",
    },
  },
  {
    ignores: ["node_modules/**", "dist/**", "main/**", "renderer/dist/**", "coverage/**", "app/**"],
  },
];

