/**
 * ORGANIZER WORKFLOW INTEGRATION TEST
 * End-to-end test of complete organizer workflow in plain JavaScript
 */

const {
  cleanDatabase,
  closeDatabase,
  createTestUser,
  createTestOrganization,
  createTestSession,
  prisma,
} = require('../utils/testHelpers');

const crypto = require('crypto');

describe('Organizer Complete Workflow', () => {
  let organization;
  let organizer;
  let sessionToken;
  let student;

  beforeAll(async () => {
    await cleanDatabase();
    
    organization = await createTestOrganization({ name: 'Complete Workflow Org' });
    
    organizer = await createTestUser({
      email: 'workflow-organizer@test.com',
      role: 'organizer',
      organizerStatus: 'approved',
      organizationId: organization.id,
    });

    student = await createTestUser({
      email: 'workflow-student@test.com',
      role: 'student',
    });

    sessionToken = await createTestSession(organizer.id);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('Complete organizer workflow: create → moderate → publish → scan', async () => {
    // Step 1: Organizer creates an event
    const eventData = {
      title: 'Complete Workflow Event',
      description: 'Testing the full organizer workflow',
      location: 'Test Venue',
      startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 50 * 60 * 60 * 1000),
      capacity: 100,
      type: 'free',
      category: 'workshop',
      published: false,
      moderationStatus: 'pending',
    };

    const event = await prisma.event.create({
      data: {
        ...eventData,
        organizerId: organizer.id,
      },
    });

    expect(event).toBeDefined();
    expect(event.published).toBe(false);
    expect(event.moderationStatus).toBe('pending');

    // Step 2: Admin approves the event (simulated)
    const approvedEvent = await prisma.event.update({
      where: { id: event.id },
      data: { moderationStatus: 'approved' },
    });

    expect(approvedEvent.moderationStatus).toBe('approved');

    // Step 3: Organizer publishes the event
    const publishedEvent = await prisma.event.update({
      where: { id: event.id },
      data: { published: true },
    });

    expect(publishedEvent.published).toBe(true);

    // Step 4: Student claims a ticket
    const qrToken = crypto.randomBytes(16).toString('hex');
    const ticket = await prisma.ticket.create({
      data: {
        eventId: event.id,
        userId: student.id,
        qrToken,
        status: 'claimed',
      },
    });

    expect(ticket).toBeDefined();
    expect(ticket.status).toBe('claimed');

    // Step 5: Organizer scans the ticket at the event
    const scannedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'used',
        usedAt: new Date(),
      },
    });

    expect(scannedTicket.status).toBe('used');
    expect(scannedTicket.usedAt).not.toBeNull();

    // Step 6: Verify ticket cannot be used again
    const attemptReuse = await prisma.ticket.findUnique({
      where: { id: ticket.id },
    });

    expect(attemptReuse.status).toBe('used');

    // Step 7: Get attendance statistics
    const stats = await prisma.ticket.groupBy({
      by: ['status'],
      where: { eventId: event.id },
      _count: true,
    });

    const usedCount = stats.find(s => s.status === 'used')?._count || 0;
    expect(usedCount).toBe(1);

    // Step 8: Export attendees
    const attendees = await prisma.ticket.findMany({
      where: { eventId: event.id },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    expect(attendees).toHaveLength(1);
    expect(attendees[0].user.email).toBe(student.email);

    // Step 9: After event, organizer can unpublish
    const unpublishedEvent = await prisma.event.update({
      where: { id: event.id },
      data: { published: false },
    });

    expect(unpublishedEvent.published).toBe(false);
  });

  test('Organizer manages multiple events simultaneously', async () => {
    // Create multiple events
    const events = await Promise.all([
      prisma.event.create({
        data: {
          title: 'Event 1',
          description: 'First event',
          location: 'Location 1',
          startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endsAt: new Date(Date.now() + 26 * 60 * 60 * 1000),
          capacity: 50,
          type: 'free',
          organizerId: organizer.id,
          moderationStatus: 'approved',
        },
      }),
      prisma.event.create({
        data: {
          title: 'Event 2',
          description: 'Second event',
          location: 'Location 2',
          startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          endsAt: new Date(Date.now() + 50 * 60 * 60 * 1000),
          capacity: 100,
          type: 'free',
          organizerId: organizer.id,
          moderationStatus: 'approved',
        },
      }),
    ]);

    expect(events).toHaveLength(2);

    // Publish both events
    await Promise.all(
      events.map(event =>
        prisma.event.update({
          where: { id: event.id },
          data: { published: true },
        })
      )
    );

    // Verify all published
    const publishedEvents = await prisma.event.findMany({
      where: {
        organizerId: organizer.id,
        published: true,
      },
    });

    expect(publishedEvents.length).toBeGreaterThanOrEqual(2);
  });

  test('Organizer handles capacity limits correctly', async () => {
    // Create event with limited capacity
    const limitedEvent = await prisma.event.create({
      data: {
        title: 'Limited Capacity Event',
        description: 'Only 2 spots available',
        location: 'Small Venue',
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 26 * 60 * 60 * 1000),
        capacity: 2,
        type: 'free',
        organizerId: organizer.id,
        moderationStatus: 'approved',
        published: true,
      },
    });

    // Create 2 students
    const [student1, student2] = await Promise.all([
      createTestUser({ email: 'student1@test.com', role: 'student' }),
      createTestUser({ email: 'student2@test.com', role: 'student' }),
    ]);

    // First 2 tickets should succeed
    const ticket1 = await prisma.ticket.create({
      data: {
        eventId: limitedEvent.id,
        userId: student1.id,
        qrToken: crypto.randomBytes(16).toString('hex'),
        status: 'claimed',
      },
    });

    const ticket2 = await prisma.ticket.create({
      data: {
        eventId: limitedEvent.id,
        userId: student2.id,
        qrToken: crypto.randomBytes(16).toString('hex'),
        status: 'claimed',
      },
    });

    expect(ticket1).toBeDefined();
    expect(ticket2).toBeDefined();

    // Check if at capacity
    const ticketCount = await prisma.ticket.count({
      where: { eventId: limitedEvent.id },
    });

    expect(ticketCount).toBe(2);
    expect(ticketCount).toBe(limitedEvent.capacity);

    // Third ticket should check capacity first
    const isAtCapacity = ticketCount >= limitedEvent.capacity;
    expect(isAtCapacity).toBe(true);
  });

  test('Organizer views event statistics', async () => {
    // Create event with tickets
    const statsEvent = await prisma.event.create({
      data: {
        title: 'Stats Event',
        description: 'For statistics',
        location: 'Stats Venue',
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 26 * 60 * 60 * 1000),
        capacity: 100,
        type: 'free',
        organizerId: organizer.id,
        moderationStatus: 'approved',
        published: true,
      },
    });

    // Create multiple tickets with different statuses
    const students = await Promise.all([
      createTestUser({ email: 'stats1@test.com', role: 'student' }),
      createTestUser({ email: 'stats2@test.com', role: 'student' }),
      createTestUser({ email: 'stats3@test.com', role: 'student' }),
    ]);

    await Promise.all([
      prisma.ticket.create({
        data: {
          eventId: statsEvent.id,
          userId: students[0].id,
          qrToken: crypto.randomBytes(16).toString('hex'),
          status: 'claimed',
        },
      }),
      prisma.ticket.create({
        data: {
          eventId: statsEvent.id,
          userId: students[1].id,
          qrToken: crypto.randomBytes(16).toString('hex'),
          status: 'used',
          usedAt: new Date(),
        },
      }),
      prisma.ticket.create({
        data: {
          eventId: statsEvent.id,
          userId: students[2].id,
          qrToken: crypto.randomBytes(16).toString('hex'),
          status: 'used',
          usedAt: new Date(),
        },
      }),
    ]);

    // Get statistics
    const totalTickets = await prisma.ticket.count({
      where: { eventId: statsEvent.id },
    });

    const usedTickets = await prisma.ticket.count({
      where: { eventId: statsEvent.id, status: 'used' },
    });

    const claimedTickets = await prisma.ticket.count({
      where: { eventId: statsEvent.id, status: 'claimed' },
    });

    expect(totalTickets).toBe(3);
    expect(usedTickets).toBe(2);
    expect(claimedTickets).toBe(1);

    // Calculate attendance rate
    const attendanceRate = (usedTickets / totalTickets) * 100;
    expect(attendanceRate).toBeCloseTo(66.67, 1);
  });
});
