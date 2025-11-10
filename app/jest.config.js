/**
 * JEST CONFIGURATION
 * Configure Jest for testing the Campus Events application
 */

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  setupFiles: ['<rootDir>/test/setupEnv.js'],
  clearMocks: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'dist/**/*.js',
    '!dist/**/index.js',
    '!dist/**/*.d.ts',
  ],
};