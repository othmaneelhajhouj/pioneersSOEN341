/**
 * JEST SETUP
 * test setup and database migrations
 */

const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

require('dotenv').config();

// Set up test database with migrations
const appRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(appRoot, 'prisma', 'schema.prisma');

if (!process.env.DATABASE_URL) {
  const tmpDir = path.join(appRoot, '.tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  const dbFile = path.join(tmpDir, `test-organizer-${Date.now()}.db`);
  process.env.DATABASE_URL = `file:${dbFile}`;
}

process.env.NODE_ENV = 'test';

// Run migrations before tests
try {
  execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
    cwd: appRoot,
    stdio: 'inherit',
    env: process.env,
  });
} catch (err) {
  console.error('Failed to run migrations:', err);
  throw err;
}

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  console.log('Test suite starting...');
});

// Global test teardown
afterAll(async () => {
  console.log('Test suite completed');
});
