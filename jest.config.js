module.exports = {
  roots: ["<rootDir>/renderer"],
  testMatch: ["**/__tests__/**/*.+(ts|tsx)", "**/?(*.)+(spec|test).+(ts|tsx)"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "./renderer/tsconfig.json" }],
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
