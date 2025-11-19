/**
 * ORGANIZER CONTROLLER TESTS
 * Essential tests for organizer event operations
 */

const {
  cleanDatabase,
  closeDatabase,
  createTestUser,
  createTestOrganization,
  prisma,
} = require('../utils/testHelpers');

const {
  event_create,
  event_delete,
  event_publish,
  event_unpublish,
  event_export_attendees,
  event_generate_image,
} = require('../../controllers/eventsController');

describe('Organizer Controller Tests', () => {
  let organization;
  let organizer;
  let anotherOrganizer;

  beforeAll(async () => {
    await cleanDatabase();
    organization = await createTestOrganization({ name: 'Test Org' });
    organizer = await createTestUser({
      email: 'organizer@test.com',
      role: 'organizer',
      organizerStatus: 'approved',
      organizationId: organization.id,
    });
    anotherOrganizer = await createTestUser({
      email: 'another@test.com',
      role: 'organizer',
      organizerStatus: 'approved',
      organizationId: organization.id,
    });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('Event Creation Validation', () => {
    test('should reject event with missing required fields', async () => {
      const req = { organizerId: organizer.id, body: { title: 'Incomplete' }, headers: { accept: 'application/json' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), render: jest.fn() };
      await event_create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should create paid event with price', async () => {
      const req = {
        organizerId: organizer.id,
        body: {
          title: 'Paid Event',
          description: 'Test',
          location: 'Test',
          startsAt: new Date(Date.now() + 86400000),
          endsAt: new Date(Date.now() + 90000000),
          capacity: 100,
          type: 'paid',
          price: 2500,
          category: 'workshop',
        },
        headers: { accept: 'application/json' },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), redirect: jest.fn() };
      await event_create(req, res);
      expect(res.status.mock.calls.length === 0 || res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Event Deletion', () => {
    test('should delete event with tickets', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Delete Test',
          description: 'Test',
          location: 'Test',
          startsAt: new Date(Date.now() + 86400000),
          endsAt: new Date(Date.now() + 90000000),
          capacity: 50,
          type: 'free',
          organizerId: organizer.id,
        },
      });
      const student = await createTestUser({ email: 'del@test.com', role: 'student' });
      await prisma.ticket.create({ data: { eventId: event.id, userId: student.id, qrToken: 'tok', status: 'claimed' } });
      
      const req = { organizerId: organizer.id, params: { eventId: event.id } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await event_delete(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
    });

    test('should prevent deleting another organizers event', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Other Event',
          description: 'Test',
          location: 'Test',
          startsAt: new Date(Date.now() + 86400000),
          endsAt: new Date(Date.now() + 90000000),
          capacity: 50,
          type: 'free',
          organizerId: anotherOrganizer.id,
        },
      });
      const req = { organizerId: organizer.id, params: { eventId: event.id } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await event_delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Publish/Unpublish', () => {
    test('should publish event', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Pub Test',
          description: 'Test',
          location: 'Test',
          startsAt: new Date(Date.now() + 86400000),
          endsAt: new Date(Date.now() + 90000000),
          capacity: 50,
          type: 'free',
          organizerId: organizer.id,
          published: false,
        },
      });
      const req = { organizerId: organizer.id, params: { eventId: event.id } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await event_publish(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
    });

    test('should prevent other organizer from publishing', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Other Pub',
          description: 'Test',
          location: 'Test',
          startsAt: new Date(Date.now() + 86400000),
          endsAt: new Date(Date.now() + 90000000),
          capacity: 50,
          type: 'free',
          organizerId: anotherOrganizer.id,
          published: false,
        },
      });
      const req = { organizerId: organizer.id, params: { eventId: event.id } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await event_publish(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('CSV Export', () => {
    test('should export with special characters', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'CSV Test',
          description: 'Test',
          location: 'Test',
          startsAt: new Date(Date.now() + 86400000),
          endsAt: new Date(Date.now() + 90000000),
          capacity: 50,
          type: 'free',
          organizerId: organizer.id,
        },
      });
      const student = await createTestUser({ email: 'csv@test.com', role: 'student', firstName: 'John "Johnny"', lastName: "O'Brien" });
      await prisma.ticket.create({ data: { eventId: event.id, userId: student.id, qrToken: 'tok', status: 'claimed' } });
      
      const req = { organizerId: organizer.id, params: { eventId: event.id }, user: organizer };
      const res = { status: jest.fn().mockReturnThis(), setHeader: jest.fn(), send: jest.fn(), json: jest.fn() };
      await event_export_attendees(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
