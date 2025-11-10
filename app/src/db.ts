//db access
// Load environment variables before initializing Prisma
import 'dotenv/config';
import {PrismaClient} from "../generated/prisma";
export const prisma = new PrismaClient();