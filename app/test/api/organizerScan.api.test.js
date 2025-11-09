// API tests for QR scanning
const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');
const multer = require('multer');
const {prisma} = require('../../dist/db');
const {organizerScan} = require('../../dist/routes/organizerScan');

function makeScanApp(user) {
  const app = express();
  app.use(bodyParser.json());
  app.use((req, _res, next) => {
    if (user) req.user = user; 
    next();
  });
  app.use(organizerScan);
  return app;
}

describe('Organizer QR scan API', () => {

  let organizer, admin, student, event, ticket;
  const uniq = `${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`;

beforeAll(async () => {
  organizer = await prisma.user.create({
    data: { email: `org+${uniq}@example.com`, passwordHash: 'x', firstName: 'Org', role: 'organizer', organizerStatus: 'approved' },
  });
  admin = await prisma.user.create({
    data: { email: `admin+${uniq}@example.com`, passwordHash: 'x', firstName: 'Admin', role: 'admin' },
  });
  student = await prisma.user.create({
    data: { email: `stu+${uniq}@example.com`, passwordHash: 'x', firstName: 'Stu', role: 'student' },
  });

    event = await prisma.event.create({
      data: {
        title: 'Scan Event',
        description: 'Check in here',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 3600000),
        location: 'Gate A',
        type: 'free',
        capacity: 10,
        organizerId: organizer.id,
        moderationStatus: 'approved',
        published: true,
      },
    });

    ticket = await prisma.ticket.create({
      data: {
        eventId: event.id,
        userId: student.id,
        qrToken: 'ABC123TOKEN',
      },
      select: {id: true, qrToken: true, status: true},
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('401 when unauthenticated', async () => {
    const app = makeScanApp(null);
    const res = await request(app)
      .post(`/organizers/${organizer.id}/events/${event.id}/scan`)
      .send({qrToken: 'ABC123TOKEN'});
    expect(res.status).toBe(401);
  });

  test('403 when non-owner organizer scans another organizer’s event', async () => {
    const other = await prisma.user.create({
      data: {email:'org2@example.com', passwordHash:'x', firstName:'Other', role: 'organizer', organizerStatus: 'approved'},
    });
    const app = makeScanApp({id: other.id, role: 'organizer'});
    const res = await request(app)
      .post(`/organizers/${organizer.id}/events/${event.id}/scan`)
      .send({qrToken: 'ABC123TOKEN'});
    expect(res.status).toBe(403);
  });

  test('200 check-in by owner organizer (first scan)', async () => {
    const app = makeScanApp({id: organizer.id, role: 'organizer'});
    const res = await request(app)
      .post(`/organizers/${organizer.id}/events/${event.id}/scan`)
      .send({ qrToken: 'ABC123TOKEN' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ok: true, state: 'checked_in'});
  });

  test('200 already_used on second scan', async () => {
    const app = makeScanApp({id: organizer.id, role: 'organizer'});
    const res = await request(app)
      .post(`/organizers/${organizer.id}/events/${event.id}/scan`)
      .send({qrToken: 'ABC123TOKEN'});
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ok: false, state: 'already_used'});
  });

  test('404 not_found with invalid token', async () => {
    const app = makeScanApp({id: organizer.id, role: 'organizer'});
    const res = await request(app)
      .post(`/organizers/${organizer.id}/events/${event.id}/scan`)
      .send({qrToken: 'NOPE'});
    expect(res.status).toBe(404);
    expect(res.body.state).toBe('not_found');
  });

  test('admin can scan any event', async () => {
    const app = makeScanApp({id: admin.id, role: 'admin'});
    const freshTicket = await prisma.ticket.create({
      data: {eventId: event.id, userId: student.id, qrToken: 'ADMINOK'},
    });
    const res = await request(app)
      .post(`/organizers/${organizer.id}/events/${event.id}/scan`)
      .send({qrToken: 'ADMINOK'});
    expect(res.status).toBe(200);
    expect(res.body.state).toBe('checked_in');
  });

  test('scan-image: 200 check-in with mocked decode', async () => {
    jest.resetModules();
    jest.doMock('jsqr', () => () => ({data: 'IMGQR'}), { virtual: true });
    jest.doMock('jimp', () => ({
      read: async () => ({
        bitmap: { data: Buffer.alloc(2 * 2 * 4), width: 2, height: 2 },
      }),
    }));
    
  let mockedRouter;
  jest.isolateModules(() => {
    mockedRouter = require('../../dist/routes/organizerScan').organizerScan;
  });

    const app = require('express')();
    app.use((req, _res, next) => {req.user = {id: organizer.id, role: 'organizer'}; next();});
    app.use(mockedRouter);

    await prisma.ticket.create({
      data: {eventId: event.id, userId: student.id, qrToken: 'IMGQR'},
    });

    const res = await request(app)
      .post(`/organizers/${organizer.id}/events/${event.id}/scan-image`)
      .attach('image', Buffer.from([0x00, 0x01, 0x02]), 'fake.png');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ok: true, state: 'checked_in'});
  });
});
