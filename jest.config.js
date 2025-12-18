module.exports = {
  roots: ["<rootDir>/renderer"],
  testMatch: ["**/__tests__/**/*.+(ts|tsx|js)", "**/?(*.)+(spec|test).+(ts|tsx|js)"],
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!is-online)/"],
  transform: {
    "^.+\\.js?$": require.resolve("babel-jest"),
    "\\.tsx$": "<rootDir>/node_modules/babel-jest",
    "^.+\\.(ts)$": ["ts-jest", { tsconfig: "./renderer/tsconfig.json" }],
  },
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/renderer/src/setupTests.ts", "jest-date-mock"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/renderer/src/$1",
    "^@electron/(.*)$": "<rootDir>/electron-src/$1",
  },
  collectCoverageFrom: [
    "renderer/src/**/*.{ts,tsx}",
    "!renderer/src/**/*.d.ts",
    "!renderer/src/**/*.stories.{ts,tsx}",
    "!renderer/src/**/__tests__/**",
  ],
};
