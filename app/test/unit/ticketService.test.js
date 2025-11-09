//Ticket claim service tests for students
const {prisma} = require('../../dist/db');
const {claimTicket} = require('../../dist/services/ticketService');

describe('ticketService.claimTicket', () => {

  let student, event;

  //Create student and event for tests
  beforeAll(async () => {
    student = await prisma.user.create({
      data: {
        email: 's1@example.com',
        passwordHash: 'x',
        firstName: 'Stu',
        role: 'student',
      },
    });

    event = await prisma.event.create({
      data: {
        title: 'Free Talk',
        description: 'Welcome',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 3600000),
        location: 'Hall',
        type: 'free',
        capacity: 1,
        organizerId: student.id,
        published: true,
        moderationStatus: 'approved',
      },
    });
  });

    //disconnect prisma client after jest exit 
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('claims first ticket (free)', async () => {
    const res = await claimTicket({eventId: event.id, userId: student.id});
    expect(res.alreadyHad).toBe(false);
    expect(res.payment).toBe('free');
    expect(res.ticket).toMatchObject({userId: student.id, eventId: event.id, status: 'claimed'});
  });

  test('second claim returns existing', async () => {
    const res = await claimTicket({eventId: event.id, userId: student.id});
    expect(res.alreadyHad).toBe(true);
  });

  test('capacity full, throws FULL', async () => {
    const other = await prisma.user.create({
        data: {email: 's2@example.com', passwordHash: 'x', firstName: 'Else', role: 'student'},
    });
    await expect(claimTicket({eventId: event.id, userId: other.id})).rejects.toThrow('FULL');
  });

  test('unpublished event, throws NOT_FOUND_OR_UNPUBLISHED', async () => {
    const e2 = await prisma.event.create({
      data: {
        title: 'Hidden',
        description: 'x',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 3600000),
        location: 'Room',
        type: 'free',
        capacity: 10,
        organizerId: student.id,
        published: false,
        moderationStatus: 'approved',
      },
    });
    await expect(claimTicket({eventId: e2.id, userId: student.id}))
      .rejects.toThrow('NOT_FOUND_OR_UNPUBLISHED');
  });
});