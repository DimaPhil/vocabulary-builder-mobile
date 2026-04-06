/** @type {import("jest").Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/ios/", "/android/"],
  collectCoverageFrom: [
    "features/admin/schemas/import.ts",
    "features/practice/schemas/session.ts",
    "lib/db/schemas.ts",
    "lib/utils/random.ts",
    "lib/utils/strings.ts",
    "lib/widget/selection.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
