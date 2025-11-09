// tests discovery filters by checking them agains prisma
const {prisma} = require('../../dist/db');

// discovery function the app uses to filter events
async function  listPublished({dateFrom, dateTo, category, location}) {
  return prisma.event.findMany({
    where: {
      published: true,
      ...(category ? {category} : {}),
      ...(location ? {location: {contains: location}} : {}),
      ...(dateFrom || dateTo? {startsAt: {...(dateFrom ? {gte: dateFrom} : {}), ...(dateTo ? {lte: dateTo} : {}) }}
        : {}),
    },
    orderBy: {startsAt: 'asc'},
  });
}

describe('event discovery', () => {

  beforeAll(async () => {
    const u = await prisma.user.create({
      data: {email: 'org@example.com', passwordHash: 'x', firstName: 'Org', role: 'organizer', organizerStatus: 'approved'},
    });

    // base fields for all test events (i.e. all events published)
    const base = {
      description: 'd', capacity: 100, type: 'free', organizerId: u.id, moderationStatus: 'approved', published: true,
    };

    // seed 3 events
    await prisma.event.createMany({
      data: [
        {title: 'Tech', location: 'Hall A', category: 'tech', startsAt: new Date('2026-01-01'), endsAt: new Date('2026-01-01T02:00Z'), ...base},
        {title: 'Art',  location: 'Hall B', category: 'art',  startsAt: new Date('2026-02-01'), endsAt: new Date('2026-02-01T02:00Z'), ...base},
        {title: 'Food', location: 'Caf',    category: 'food', startsAt: new Date('2026-03-01'), endsAt: new Date('2026-03-01T02:00Z'), ...base},
      ],
    });

    //unpublished event should not appear
    await prisma.event.create({
      data: {title: 'Hidden', location: 'X', category: 'tech', startsAt: new Date('2026-01-15'), endsAt: new Date('2026-01-15T02:00Z'), ...base, published: false},
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('filters by category and date', async () => {
    const out = await listPublished({
      category: 'tech',
      dateFrom: new Date('2025-12-31'),
      dateTo: new Date('2026-01-31'),
    });
    expect(out.map(e => e.title)).toEqual(['Tech']);
  });

  test('search by partial location', async () => {
    const out = await listPublished({location: 'Hall'});
    expect(out.length).toBe(2);
  });
});