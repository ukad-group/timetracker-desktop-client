module.exports = {
  extends: ["plugin:prettier/recommended", "prettier"],
  plugins: ["@typescript-eslint/eslint-plugin", "prettier"],
  rules: {
    "prettier/prettier": ["error", { endOfLine: "auto" }],
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2023,
    ecmaFeatures: {
      jsx: true,
    },
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./renderer/tsconfig.json",
        ecmaVersion: 2023,
        sourceType: "module",
      },
    },
    {
      files: ["**/*.js", "**/*.jsx"],
      parser: "@babel/eslint-parser",
      parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 2023,
        sourceType: "module",
        babelOptions: {
          presets: ["@babel/preset-env", "@babel/preset-react"],
        },
      },
    },
  ],
};
