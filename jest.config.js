module.exports = {
  collectCoverageFrom: [
    "renderer/src/**/*.{ts,tsx}",
    "!renderer/src/**/*.d.ts",
    "!renderer/src/**/*.stories.{ts,tsx}",
    "!renderer/src/**/__tests__/**",
    "electron-src/helpers/**/*.ts",
    "!electron-src/helpers/preload.ts",
    "!electron-src/helpers/create-window.ts",
    "!electron-src/helpers/constants.ts",
    "!electron-src/**/__tests__/**",
  ],
  projects: [
    {
      displayName: "renderer",
      roots: ["<rootDir>/renderer"],
      testMatch: ["**/__tests__/**/*.+(ts|tsx)", "**/?(*.)+(spec|test).+(ts|tsx)"],
      transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "./renderer/tsconfig.jest.json" }],
      },
      testEnvironment: "jsdom",
      setupFilesAfterEnv: ["<rootDir>/renderer/src/setupTests.ts", "jest-date-mock"],
      moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "<rootDir>/renderer/src/tests/mocks/styleMock.js",
        "^@/(.*)$": "<rootDir>/renderer/src/$1",
        "^@electron/(.*)$": "<rootDir>/electron-src/$1",
      },
    },
    {
      displayName: "electron",
      roots: ["<rootDir>/electron-src"],
      testMatch: ["**/__tests__/**/*.+(ts|tsx)", "**/?(*.)+(spec|test).+(ts|tsx)"],
      transform: {
        "^.+\\.(ts|tsx)$": [
          "ts-jest",
          {
            tsconfig: {
              esModuleInterop: true,
              isolatedModules: true,
              types: ["jest", "node"],
            },
          },
        ],
      },
      testEnvironment: "node",
    },
  ],
};
