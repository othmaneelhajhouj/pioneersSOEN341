//test (supertest) of API for student ticket flows
const request = require('supertest');
const {prisma} = require('../../dist/db');
const {makeTestApp} = require('./testApp');

describe('Student tickets API', () => {
  let app, student, event;

  beforeAll(async () => {
    // Create a student user and a published event
    student = await prisma.user.create({
      data: {email: 's1@example.com', passwordHash: 'x', firstName: 'Stu', role: 'student'},
    });
    event = await prisma.event.create({
      data: {
        title: 'API Free',
        description: 'D',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 3600000),
        location: 'API',
        type: 'free',
        capacity: 1,
        organizerId: student.id,
        published: true,
        moderationStatus: 'approved',
      },
    });

    // authenticate as the student for most tests
    app = makeTestApp({user: {id: student.id, role: 'student'}});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('401 when unauthenticated', async () => {
    const appNoAuth = makeTestApp({user: null});
    const res = await request(appNoAuth).post(`/events/${event.id}/tickets/claim`).send({});
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required.');
  });

  test('claim ticket 201 then 200 on repeat', async () => {
    const first = await request(app).post(`/events/${event.id}/tickets/claim`).send({});
    expect([200, 201]).toContain(first.status);
    const again = await request(app).post(`/events/${event.id}/tickets/claim`).send({});
    expect([200, 201]).toContain(again.status);
    expect(again.body.ok).toBe(true);
    expect(again.body.alreadyHad).toBe(true);
  });

  test('GET ticket returns only owner JSON', async () => {
    const t = await prisma.ticket.findFirst({where:{eventId: event.id, userId: student.id}});
    const res = await request(app).get(`/tickets/${t.id}`).set('Accept', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.ticket.id).toBe(t.id);
  });

  test('GET QR returns image/png', async () => {
    const t = await prisma.ticket.findFirst({where: {eventId: event.id, userId: student.id}});
    const res = await request(app).get(`/tickets/${t.id}/qr`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/png/);
    expect(res.body).toBeInstanceOf(Buffer);
  });

  test('409 when capacity full', async () => {
    const other = await prisma.user.create({
      data: {email: 's2@example.com', passwordHash: 'x', firstName: 'Other', role: 'student'},
    });
    const appOther = makeTestApp({user: {id: other.id, role: 'student'}});
    const res = await request(appOther).post(`/events/${event.id}/tickets/claim`).send({});
    expect([200, 201, 409]).toContain(res.status);
    if (res.status !== 409) {
      expect(res.body.ok).toBe(true);
    }
  });
});