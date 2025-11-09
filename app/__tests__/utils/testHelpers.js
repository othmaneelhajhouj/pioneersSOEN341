/**
 * TEST HELPERS
 * Utility functions for setting up test environment and creating test data
 */

const { PrismaClient } = require('../../generated/prisma');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Clean up database before tests
 */
async function cleanDatabase() {
  await prisma.ticket.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});
}

/**
 * Create a test organization
 */
async function createTestOrganization(data = {}) {
  const org = await prisma.organization.create({
    data: {
      name: data.name || 'Test Organization',
      description: data.description || null,
    },
  });
  
  // Ensure the turn the full organization object with id
  if (!org || !org.id) {
    throw new Error('Failed to create organization - missing id');
  }
  
  return org;
}

/**
 * Create a test user with password hash
 */
async function createTestUser(data = {}) {
  // Validate organizationId if provided
  if (data.organizationId) {
    const orgExists = await prisma.organization.findUnique({
      where: { id: data.organizationId },
    });
    if (!orgExists) {
      throw new Error(`Cannot create user: Organization with id ${data.organizationId} does not exist`);
    }
  }
  
  const salt = crypto.randomBytes(16);
  const passwordHash = crypto.scryptSync('password123', salt, 64);
  const combinedHash = Buffer.concat([salt, passwordHash]);

  const userData = {
    email: data.email || `test-${Date.now()}@example.com`,
    firstName: data.firstName || 'Test',
    lastName: data.lastName || 'User',
    role: data.role || 'student',
    passwordHash: combinedHash.toString('base64'),
    organizerStatus: data.organizerStatus || null,
    organizationId: data.organizationId || null,
  };

  return await prisma.user.create({
    data: userData,
  });
}

/**
 * Create a test session for a user
 */
async function createTestSession(userId) {
  const sessionToken = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return sessionToken;
}

/**
 * Create a test event
 * Can be called two ways:
 * 1. createTestEvent(organizerId, data) - organizerId as first param
 * 2. createTestEvent({ organizerId, ...data }) - all data in one object
 */
async function createTestEvent(organizerIdOrData, data = {}) {
  // Handle both calling patterns
  let organizerId;
  let eventData;

  if (typeof organizerIdOrData === 'string') {
    // Old pattern: createTestEvent(organizerId, data)
    organizerId = organizerIdOrData;
    eventData = data;
  } else {
    // New pattern: createTestEvent({ organizerId, ...data })
    organizerId = organizerIdOrData.organizerId;
    eventData = organizerIdOrData;
  }

  const startsAt = eventData.startsAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
  const endsAt = eventData.endsAt || new Date(startsAt.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  return await prisma.event.create({
    data: {
      title: eventData.title || 'Test Event',
      description: eventData.description || 'This is a test event',
      location: eventData.location || 'Test Location',
      capacity: eventData.capacity || 100,
      published: eventData.published ?? false,
      moderationStatus: eventData.moderationStatus || 'pending',
      category: eventData.category,
      type: eventData.type || 'free',
      price: eventData.price,
      startsAt,
      endsAt,
      organizerId, // Must be a string ID, not an object
    },
  });
}

/**
 * Create a test ticket
 * Supports two calling patterns:
 * 1. createTestTicket(eventId, userId, status) - Old pattern
 * 2. createTestTicket({ eventId, userId, status }) - New pattern
 */
async function createTestTicket(eventIdOrData, userId, status = 'claimed') {
  let eventId, ticketData;
  
  // Detect calling pattern
  if (typeof eventIdOrData === 'string') {
    // Old pattern: createTestTicket(eventId, userId, status)
    eventId = eventIdOrData;
    ticketData = { userId, status };
  } else {
    // New pattern: createTestTicket({ eventId, userId, status })
    eventId = eventIdOrData.eventId;
    ticketData = eventIdOrData;
  }
  
  const qrToken = crypto.randomBytes(16).toString('hex');
  
  // Normalize status: only 'claimed' and 'used' are valid in TicketStatus enum
  // Convert any other status values to 'claimed'
  let ticketStatus = ticketData.status || 'claimed';
  if (ticketStatus !== 'claimed' && ticketStatus !== 'used') {
    ticketStatus = 'claimed';
  }
  
  return await prisma.ticket.create({
    data: {
      eventId,
      userId: ticketData.userId,
      qrToken: ticketData.qrToken || qrToken,
      status: ticketStatus,
    },
  });
}

/**
 * Mock Express request object
 */
function mockRequest(overrides = {}) {
  const req = {
    params: {},
    query: {},
    body: {},
    headers: {},
    user: null,
    ...overrides,
  };
  
  // Automatically set req.organizerId if params.organizerId is provided
  // This mimics what the checkOrganizerPermissions middleware does
  if (req.params?.organizerId && !req.organizerId) {
    req.organizerId = req.params.organizerId;
  }
  
  return req;
}

/**
 * Mock Express response object
 */
function mockResponse() {
  const res = {
    statusCode: 200,
    data: null,
    headers: {}, // Store headers set via setHeader
  };
  
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  
  res.json = jest.fn((data) => {
    res.data = data;
    return res;
  });
  
  res.send = jest.fn((data) => {
    res.data = data;
    return res;
  });
  
  res.redirect = jest.fn((url) => {
    res.redirectUrl = url;
    return res;
  });
  
  res.render = jest.fn((view, data) => {
    res.view = view;
    res.renderData = data;
    return res;
  });
  
  res.setHeader = jest.fn((name, value) => {
    res.headers[name] = value;
    return res;
  });
  
  return res;
}

/**
 * Close database connection after tests
 */
async function closeDatabase() {
  await prisma.$disconnect();
}

module.exports = {
  prisma,
  cleanDatabase,
  createTestOrganization,
  createTestUser,
  createTestSession,
  createTestEvent,
  createTestTicket,
  mockRequest,
  mockResponse,
  closeDatabase,
};
