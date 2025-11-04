const crypto = require("crypto");
const prisma = require("./prisma");

const PASSWORD_BYTES = 64;
const SESSION_TOKEN_BYTES = 48;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // default 7 days

function createSalt() {
  return crypto.randomBytes(16);
}

function hashPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const salt = createSalt();
  const derived = crypto.scryptSync(password, salt, PASSWORD_BYTES);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const storedHash = Buffer.from(hashHex, "hex");
  const derived = crypto.scryptSync(password, salt, storedHash.length);
  return crypto.timingSafeEqual(storedHash, derived);
}

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateSessionToken() {
  return crypto.randomBytes(SESSION_TOKEN_BYTES).toString("hex");
}

async function createSession(userId, { ttlMs = SESSION_TTL_MS } = {}) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + ttlMs);
  const tokenHash = hashSessionToken(token);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

async function findSession(token) {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findFirst({
    where: { tokenHash },
    include: {
      user: true,
    },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session;
}

async function destroySession(token) {
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

async function destroySessionById(id) {
  await prisma.session.deleteMany({ where: { id } });
}

async function invalidateUserSessions(userId) {
  await prisma.session.deleteMany({ where: { userId } });
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  findSession,
  destroySession,
  destroySessionById,
  invalidateUserSessions,
};
