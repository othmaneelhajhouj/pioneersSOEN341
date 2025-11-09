/**
 * JEST SETUP
 * Global test setup and teardown
 */

require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:./prisma/test.db';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  console.log('🧪 Test suite starting...');
});

// Global test teardown
afterAll(async () => {
  console.log('✅ Test suite completed');
});
