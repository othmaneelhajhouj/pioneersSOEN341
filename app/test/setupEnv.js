//Set DB URL before imports
const path = require('node:path');
const fs = require('node:fs');

const templateDb = path.resolve(__dirname, '../..', 'prisma', 'prisma', 'dev.db');
const testDb = path.resolve(__dirname, '../..', '.tmp', `test-${Date.now()}.db`);

fs.mkdirSync(path.dirname(testDb), { recursive: true });
if (fs.existsSync(templateDb)) 
{
  fs.copyFileSync(templateDb, testDb);
} 
else 
{
    process.env.DATABASE_URL = 'file:memdb1?mode=memory&cache=shared'; //use db in cache/memory if template is missing 
}


if (!process.env.DATABASE_URL) 
{
  process.env.DATABASE_URL = `file:${testDb}`;
}

process.env.NODE_ENV = 'test';