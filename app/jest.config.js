/**
 * JEST CONFIGURATION
 * Configure Jest for testing the Campus Events application
 */

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'controllers/**/*.js',
    'middlewares/**/*.js',
    'lib/**/*.js',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/generated/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  moduleNameMapper: {
    '^generated-prisma/client$': '<rootDir>/generated/prisma',
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testTimeout: 30000,
};
