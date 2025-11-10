//Set DB URL before imports
const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const appRoot = path.resolve(__dirname, '..');           // -> app/
const schemaPath = path.join(appRoot, 'prisma', 'schema.prisma');

if (!process.env.DATABASE_URL) {
  const tmpDir = path.join(appRoot, '.tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  const dbFile = path.join(tmpDir, `test-${Date.now()}.db`);
  process.env.DATABASE_URL = `file:${dbFile}`;
}

process.env.NODE_ENV = 'test';

try {
  execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
    cwd: appRoot,
    stdio: 'inherit',
    env: process.env,
  });
} catch (err) {
  throw err;
}
