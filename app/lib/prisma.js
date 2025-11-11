// Load environment variables before initializing Prisma
require('dotenv').config();

const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

module.exports = prisma;
