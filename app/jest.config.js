/**
 * JEST CONFIGURATION
 * Configure Jest for testing the Campus Events application
 * Supports both test/ (Othmane's TypeScript tests) and __tests__/ (Renato's organizer tests)
 */

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'dist/**/*.js',
    'middlewares/**/*.js',
    'controllers/**/*.js',
    'lib/**/*.js',
    '!dist/**/index.js',
    '!dist/**/*.d.ts',
    '!**/node_modules/**',
  ],
  projects: [
    {
      // Othmane's tests in test/ directory
      displayName: 'test-suite',
      testMatch: ['<rootDir>/test/**/*.test.js'],
      setupFiles: ['<rootDir>/test/setupEnv.js'],
    },
    {
      // Renato's organizer tests in __tests__/ directory
      displayName: 'organizer-tests',
      testMatch: ['<rootDir>/__tests__/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
    },
  ],
};