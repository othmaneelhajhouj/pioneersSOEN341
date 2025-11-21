const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const crypto = require("crypto");

const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
const hoursAfter = (date, h) => new Date(date.getTime() + h * 60 * 60 * 1000);
const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

// Pre-baked geocode results so seed data renders maps without hitting Mapbox during local setup
const SEED_GEOCODES = {
  "1455 De Maisonneuve Blvd W, Montreal, QC H3G 1M8": {
    formattedAddress: "1455 De Maisonneuve Blvd W, Montreal, QC H3G 1M8, Canada",
    latitude: 45.497216,
    longitude: -73.578909,
    geocodeStatus: "ok",
    geocodePrecision: 8,
  },
  "1515 St. Catherine St W, Montreal, QC H3G 2W1": {
    formattedAddress: "1515 Saint-Catherine St W, Montreal, QC H3G 2W1, Canada",
    latitude: 45.49575,
    longitude: -73.5792,
    geocodeStatus: "ok",
    geocodePrecision: 8,
  },
  "1450 Guy St, Montreal, QC H3H 2L7": {
    formattedAddress: "1450 Guy St, Montreal, QC H3H 2L7, Canada",
    latitude: 45.4949,
    longitude: -73.5785,
    geocodeStatus: "ok",
    geocodePrecision: 8,
  },
  "7141 Sherbrooke St W, Montreal, QC H4B 1R6": {
    formattedAddress: "7141 Sherbrooke St W, Montreal, QC H4B 1R6, Canada",
    latitude: 45.4583,
    longitude: -73.6385,
    geocodeStatus: "ok",
    geocodePrecision: 8,
  },
  "Zoom (Online)": {
    geocodeStatus: "unavailable",
    geocodeMessage: "Online event (no map)",
  },
};

const geocodeForSeed = (location) => {
  const geo = SEED_GEOCODES[location];
  if (!geo) {
    return { geocodeStatus: "unavailable", geocodeMessage: "Geocode not provided in seed data" };
  }
  if (geo.geocodeStatus === "ok") {
    return { ...geo, geocodedAt: new Date() };
  }
  return geo;
};

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function main() {
  console.log("Resetting database...");
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log("Creating users/organization...");
  const [organizer1, organizer2, organizer3] = await Promise.all([
    prisma.user.create({ data: { email: "org1@example.com", firstName: "Alex",   lastName: "Smith",  role: "organizer", organizerStatus: "pending", passwordHash: hashPassword("Organizer123!") } }),
    prisma.user.create({ data: { email: "org2@example.com", firstName: "Morgan", lastName: "Chen",   role: "organizer", organizerStatus: "pending", passwordHash: hashPassword("Organizer123!") } }),
    prisma.user.create({ data: { email: "org3@example.com", firstName: "Jamie",  lastName: "Lopez",  role: "organizer", organizerStatus: "approved", passwordHash: hashPassword("Organizer123!") } }),
  ]);

  const [student1, student2, student3, student4, admin1] = await Promise.all([
    prisma.user.create({ data: { email: "student1@example.com", firstName: "Casey",  lastName: "Doe",   role: "student",  passwordHash: hashPassword("Student123!")  } }),
    prisma.user.create({ data: { email: "student2@example.com", firstName: "Jordan", lastName: "Lee",   role: "student",  passwordHash: hashPassword("Student123!")  } }),
    prisma.user.create({ data: { email: "student3@example.com", firstName: "Taylor", lastName: "Kim",   role: "student",  passwordHash: hashPassword("Student123!")  } }),
    prisma.user.create({ data: { email: "student4@example.com", firstName: "Sam",    lastName: "Brown", role: "student",  passwordHash: hashPassword("Student123!")  } }),
    prisma.user.create({ data: { email: "admin1@example.com",   firstName: "Avery",  lastName: "Ng",    role: "admin",    passwordHash: hashPassword("Admin123!")    } }),
  ]);

  const [orgCsClub, orgEngSoc, orgAiLab] = await Promise.all([
    prisma.organization.create({
      data: {
        name: "CS Club",
        description: "Computer science society",
      },
    }),
    prisma.organization.create({
      data: {
        name: "Engineering Society",
        description: "Student-led engineering events and competitions",
      },
    }),
    prisma.organization.create({
      data: {
        name: "AI Research Lab",
        description: "Talks and workshops on AI and machine learning",
      },
    }),
  ]);
  await prisma.user.update({
    where: { id: organizer1.id },
    data: { organizationId: orgCsClub.id },
  });
  await prisma.user.update({
    where: { id: organizer2.id },
    data: { organizationId: orgEngSoc.id },
  });
  await prisma.user.update({
    where: { id: organizer3.id },
    data: { organizationId: orgAiLab.id },
  });

  console.log("Creating events (only organizers own them)...");
  const createdEvents = [];

  async function addEvent(data) {
    const e = await prisma.event.create({ data: { ...data, ...geocodeForSeed(data.location) } });
    createdEvents.push(e);
    return e;
  }

  // Organizer 1 - Events created at different times
  await addEvent({
    title: "Welcome Back Fair",
    description: "Campus clubs, music, and food trucks.",
    startsAt: daysAgo(7),
    endsAt: hoursAfter(daysAgo(7), 2),
    location: "1455 De Maisonneuve Blvd W, Montreal, QC H3G 1M8", // Hall Building
    type: "free",
    price: 0,
    capacity: 200,
    organizerId: organizer1.id,
    published: true,
    category: "Campus life",
    moderationStatus: "approved",
    createdAt: daysAgo(45), // Created 45 days ago
  });
  await addEvent({
    title: "Career Development Workshop",
    description: "Resume tips, mock interviews, networking prep.",
    startsAt: daysFromNow(10),
    endsAt: hoursAfter(daysFromNow(10), 3),
    location: "Zoom (Online)",
    type: "free",
    price: 0,
    capacity: 100,
    organizerId: organizer1.id,
    published: true,
    category: "Career development",
    moderationStatus: "approved",
    createdAt: daysAgo(30), // Created 30 days ago
  });

  // Organizer 2 - More recent events
  await addEvent({
    title: "Full-Stack Coding Bootcamp",
    description: "Hands-on web dev workshop (HTML/CSS/JS).",
    startsAt: daysFromNow(14),
    endsAt: hoursAfter(daysFromNow(14), 6),
    location: "1515 St. Catherine St W, Montreal, QC H3G 2W1", // EV Building
    type: "paid",
    price: 2500, // $25.00
    capacity: 50,
    organizerId: organizer2.id,
    published: true,
    category: "Career development",
    moderationStatus: "approved",
    createdAt: daysAgo(20), // Created 20 days ago
  });
  await addEvent({
    title: "Tech Networking Night",
    description: "Meet startups, recruiters, and alumni in tech.",
    startsAt: daysFromNow(21),
    endsAt: hoursAfter(daysFromNow(21), 3),
    location: "1450 Guy St, Montreal, QC H3H 2L7", // JMSB Building
    type: "free",
    price: 0,
    capacity: 120,
    organizerId: organizer2.id,
    published: false, // draft
    category: "Career development",
    createdAt: daysAgo(15), // Created 15 days ago
  });

  // Organizer 3 - Mix of old and new
  await addEvent({
    title: "Hackathon 2025",
    description: "48-hour coding marathon with prizes & mentors.",
    startsAt: daysFromNow(30),
    endsAt: hoursAfter(daysFromNow(30), 48),
    location: "1455 De Maisonneuve Blvd W, Montreal, QC H3G 1M8", // Hall Building Conference Hall
    type: "paid",
    price: 1500, // $15.00
    capacity: 300,
    organizerId: organizer3.id,
    published: true,
    category: "Campus life",
    moderationStatus: "approved",
    createdAt: daysAgo(60), // Created 60 days ago
  });
  await addEvent({
    title: "Startup Pitch Night",
    description: "Entrepreneurs pitch ideas to judges & VCs.",
    startsAt: daysFromNow(40),
    endsAt: hoursAfter(daysFromNow(40), 4),
    location: "1450 Guy St, Montreal, QC H3H 2L7", // MB Building
    type: "paid",
    price: 1000, // $10.00
    capacity: 150,
    organizerId: organizer3.id,
    published: false, // draft
    category: "Career development",
    createdAt: daysAgo(10), // Created 10 days ago
  });
  await addEvent({
    title: "Summer Wrap-Up Social",
    description: "Casual mixer and snacks (past event).",
    startsAt: daysFromNow(-5),
    endsAt: hoursAfter(daysFromNow(-5), 2),
    location: "7141 Sherbrooke St W, Montreal, QC H4B 1R6", // Loyola Campus
    type: "free",
    price: 0,
    capacity: 80,
    organizerId: organizer3.id,
    published: true,
    category: "Campus life",
    moderationStatus: "approved",
    createdAt: daysAgo(70), // Created 70 days ago - old event
  });

  // Add more events for better analytics
  await addEvent({
    title: "React Workshop Series",
    description: "Learn modern React with hooks and state management.",
    startsAt: daysFromNow(5),
    endsAt: hoursAfter(daysFromNow(5), 4),
    location: "1515 St. Catherine St W, Montreal, QC H3G 2W1",
    type: "paid",
    price: 1500,
    capacity: 40,
    organizerId: organizer1.id,
    published: true,
    category: "Career development",
    moderationStatus: "approved",
    createdAt: daysAgo(25),
  });

  await addEvent({
    title: "AI & Machine Learning Symposium",
    description: "Explore cutting-edge AI research and applications.",
    startsAt: daysFromNow(12),
    endsAt: hoursAfter(daysFromNow(12), 6),
    location: "1455 De Maisonneuve Blvd W, Montreal, QC H3G 1M8",
    type: "paid",
    price: 3500,
    capacity: 150,
    organizerId: organizer2.id,
    published: true,
    category: "Career development",
    moderationStatus: "approved",
    createdAt: daysAgo(35),
  });

  await addEvent({
    title: "Game Night Extravaganza",
    description: "Board games, video games, and pizza!",
    startsAt: daysFromNow(3),
    endsAt: hoursAfter(daysFromNow(3), 5),
    location: "1450 Guy St, Montreal, QC H3H 2L7",
    type: "free",
    price: 0,
    capacity: 100,
    organizerId: organizer3.id,
    published: true,
    category: "Campus life",
    moderationStatus: "approved",
    createdAt: daysAgo(5),
  });

  console.log("Creating tickets...");
  const id = Object.fromEntries(createdEvents.map((e) => [e.title, e.id]));

  // Create tickets with varied creation times and check-ins for analytics
  await prisma.ticket.createMany({
    data: [
      // Welcome Back Fair - past event with completed check-ins
      { eventId: id["Welcome Back Fair"], userId: student1.id, qrToken: "QR-CASEY-WELCOME", createdAt: daysAgo(40), claimedAt: daysAgo(40), usedAt: daysAgo(7) },
      { eventId: id["Welcome Back Fair"], userId: student2.id, qrToken: "QR-JORDAN-WELCOME", createdAt: daysAgo(38), claimedAt: daysAgo(38), usedAt: daysAgo(7) },
      { eventId: id["Welcome Back Fair"], userId: student3.id, qrToken: "QR-TAYLOR-WELCOME-CHECKED", createdAt: daysAgo(35), claimedAt: daysAgo(35), usedAt: daysAgo(7) },
      { eventId: id["Welcome Back Fair"], userId: student4.id, qrToken: "QR-SAM-WELCOME", createdAt: daysAgo(25), claimedAt: daysAgo(25) },

      // Career Development Workshop - recent ticket sales, no check-ins yet (upcoming)
      { eventId: id["Career Development Workshop"], userId: student3.id, qrToken: "QR-TAYLOR-CAREER", createdAt: daysAgo(15), claimedAt: daysAgo(15) },
      { eventId: id["Career Development Workshop"], userId: student4.id, qrToken: "QR-SAM-CAREER", createdAt: daysAgo(10), claimedAt: daysAgo(10) },
      { eventId: id["Career Development Workshop"], userId: student1.id, qrToken: "QR-CASEY-CAREER", createdAt: daysAgo(8), claimedAt: daysAgo(8) },

      // Full-Stack Coding Bootcamp - paid event with strong pre-sales (no check-ins yet)
      { eventId: id["Full-Stack Coding Bootcamp"], userId: student1.id, qrToken: "QR-CASEY-BOOTCAMP", createdAt: daysAgo(18), claimedAt: daysAgo(18) },
      { eventId: id["Full-Stack Coding Bootcamp"], userId: student4.id, qrToken: "QR-SAM-BOOTCAMP-EARLY", createdAt: daysAgo(17), claimedAt: daysAgo(17) },
      { eventId: id["Full-Stack Coding Bootcamp"], userId: student2.id, qrToken: "QR-JORDAN-BOOTCAMP", createdAt: daysAgo(15), claimedAt: daysAgo(15) },
      { eventId: id["Full-Stack Coding Bootcamp"], userId: student3.id, qrToken: "QR-TAYLOR-BOOTCAMP", createdAt: daysAgo(12), claimedAt: daysAgo(12) },

      // Tech Networking Night - draft event with some interest
      { eventId: id["Tech Networking Night"], userId: student2.id, qrToken: "QR-JORDAN-NET", createdAt: daysAgo(12), claimedAt: daysAgo(12) },
      { eventId: id["Tech Networking Night"], userId: student4.id, qrToken: "QR-SAM-NET", createdAt: daysAgo(8), claimedAt: daysAgo(8) },

      // Hackathon 2025 - popular event with many tickets over time
      { eventId: id["Hackathon 2025"], userId: student4.id, qrToken: "QR-SAM-HACK", createdAt: daysAgo(55), claimedAt: daysAgo(55) },
      { eventId: id["Hackathon 2025"], userId: student2.id, qrToken: "QR-JORDAN-HACK-EARLY", createdAt: daysAgo(50), claimedAt: daysAgo(50) },
      { eventId: id["Hackathon 2025"], userId: student1.id, qrToken: "QR-CASEY-HACK", createdAt: daysAgo(45), claimedAt: daysAgo(45) },
      { eventId: id["Hackathon 2025"], userId: student3.id, qrToken: "QR-TAYLOR-HACK", createdAt: daysAgo(35), claimedAt: daysAgo(35) },

      // Startup Pitch Night - recent draft with good interest
      { eventId: id["Startup Pitch Night"], userId: student3.id, qrToken: "QR-TAYLOR-PITCH", createdAt: daysAgo(7), claimedAt: daysAgo(7) },
      { eventId: id["Startup Pitch Night"], userId: student1.id, qrToken: "QR-CASEY-PITCH", createdAt: daysAgo(5), claimedAt: daysAgo(5) },

      // Summer Wrap-Up Social - past event with all checked in
      { eventId: id["Summer Wrap-Up Social"], userId: student1.id, qrToken: "QR-CASEY-SUMMER", createdAt: daysAgo(65), claimedAt: daysAgo(65), usedAt: daysAgo(5) },
      { eventId: id["Summer Wrap-Up Social"], userId: student2.id, qrToken: "QR-JORDAN-SUMMER", createdAt: daysAgo(60), claimedAt: daysAgo(60), usedAt: daysAgo(5) },

      // React Workshop Series - recent tickets, check-ins start day-of
      { eventId: id["React Workshop Series"], userId: student2.id, qrToken: "QR-JORDAN-REACT", createdAt: daysAgo(20), claimedAt: daysAgo(20) },
      { eventId: id["React Workshop Series"], userId: student3.id, qrToken: "QR-TAYLOR-REACT", createdAt: daysAgo(18), claimedAt: daysAgo(18) },
      { eventId: id["React Workshop Series"], userId: student4.id, qrToken: "QR-SAM-REACT", createdAt: daysAgo(15), claimedAt: daysAgo(15) },

      // AI & Machine Learning Symposium - premium event with pre-sales (attendance tracked day-of)
      { eventId: id["AI & Machine Learning Symposium"], userId: student1.id, qrToken: "QR-CASEY-AI", createdAt: daysAgo(32), claimedAt: daysAgo(32) },
      { eventId: id["AI & Machine Learning Symposium"], userId: student2.id, qrToken: "QR-JORDAN-AI", createdAt: daysAgo(30), claimedAt: daysAgo(30) },
      { eventId: id["AI & Machine Learning Symposium"], userId: student3.id, qrToken: "QR-TAYLOR-AI", createdAt: daysAgo(28), claimedAt: daysAgo(28) },
      { eventId: id["AI & Machine Learning Symposium"], userId: student4.id, qrToken: "QR-SAM-AI", createdAt: daysAgo(25), claimedAt: daysAgo(25) },

      // Game Night Extravaganza - very recent event with progressive ticket sales
      { eventId: id["Game Night Extravaganza"], userId: student1.id, qrToken: "QR-CASEY-GAME", createdAt: daysAgo(4), claimedAt: daysAgo(4) },
      { eventId: id["Game Night Extravaganza"], userId: student2.id, qrToken: "QR-JORDAN-GAME", createdAt: daysAgo(3), claimedAt: daysAgo(3) },
      { eventId: id["Game Night Extravaganza"], userId: student3.id, qrToken: "QR-TAYLOR-GAME", createdAt: daysAgo(2), claimedAt: daysAgo(2) },
      { eventId: id["Game Night Extravaganza"], userId: student4.id, qrToken: "QR-SAM-GAME", createdAt: daysAgo(1), claimedAt: daysAgo(1) },
    ],
  });

  // Align ticket status with check-ins so organizer analytics show correct attendance
  await prisma.ticket.updateMany({
    where: { usedAt: { not: null } },
    data: { status: "used" },
  });

  console.log("Seed complete");
  console.log("Default credentials:");
  console.log("  Admin:     admin1@example.com / Admin123!");
  console.log("  Organizer: org1@example.com / Organizer123!");
  console.log("  Student:   student1@example.com / Student123!");
}

main()
  .catch((err) => {
    console.error("Seed failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
