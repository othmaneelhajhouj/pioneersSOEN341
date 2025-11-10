/**
 * JEST CONFIGURATION
 * Configure Jest for testing the Campus Events application
 * Supports both test/ (Othmane's tests) and __tests__/ (Renato's tests)
 */

module.exports = {
  testTimeout: 30000,
  projects: [
    // Othmane's tests
    {
      displayName: 'test-suite',
      testEnvironment: 'node',
      roots: ['<rootDir>/test'],
      testMatch: ['**/test/**/*.test.js'],
      setupFiles: ['<rootDir>/test/setupEnv.js'],
    },
    // Renato's organizer tests
    {
      displayName: 'organizer-tests',
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
      coverageDirectory: '<rootDir>/coverage',
      coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
      moduleNameMapper: {
        '^generated-prisma/client$': '<rootDir>/generated/prisma',
      },
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
    },
  ],
};