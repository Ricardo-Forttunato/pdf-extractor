import type { Config } from "jest";
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testMatch: ["<rootDir>/tests/**/*.test.ts?(x)"],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/app/**/*.tsx"]
};
export default config;
