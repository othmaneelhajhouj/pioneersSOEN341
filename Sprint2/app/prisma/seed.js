const { PrismaClient } = require("generated-prisma/client");
const prisma = new PrismaClient();

const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);
const hoursAfter = (date, h) => new Date(date.getTime() + h * 60 * 60 * 1000);

async function main() {
  console.log("Resetting database...");
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log("Creating users/organization...");
  const [organizer1, organizer2, organizer3] = await Promise.all([
    prisma.user.create({ data: { email: "org1@example.com", firstName: "Alex",   lastName: "Smith",  role: "organizer", organizerStatus: "pending" } }),
    prisma.user.create({ data: { email: "org2@example.com", firstName: "Morgan", lastName: "Chen",   role: "organizer", organizerStatus: "pending" } }),
    prisma.user.create({ data: { email: "org3@example.com", firstName: "Jamie",  lastName: "Lopez",  role: "organizer", organizerStatus: "pending" } }),
  ]);

  const [student1, student2, student3, student4, admin1] = await Promise.all([
    prisma.user.create({ data: { email: "student1@example.com", firstName: "Casey",  lastName: "Doe",   role: "student"  } }),
    prisma.user.create({ data: { email: "student2@example.com", firstName: "Jordan", lastName: "Lee",   role: "student"  } }),
    prisma.user.create({ data: { email: "student3@example.com", firstName: "Taylor", lastName: "Kim",   role: "student"  } }),
    prisma.user.create({ data: { email: "student4@example.com", firstName: "Sam",    lastName: "Brown", role: "student"  } }),
    prisma.user.create({ data: { email: "admin1@example.com",   firstName: "Avery",  lastName: "Ng",    role: "admin"    } }),
  ]);

  const organization = await prisma.organization.create({
    data: {
      name: "CS Club",
      description: "Computer science society",
    },
  });
  await prisma.user.update({
    where: { id: organizer1.id },
    data: { organizationId: organization.id },
  });
  await prisma.user.update({
    where: { id: organizer2.id },
    data: { organizationId: organization.id },
  });
  await prisma.user.update({
    where: { id: organizer3.id },
    data: { organizationId: organization.id },
  });

  console.log("Creating events (only organizers own them)...");
  const createdEvents = [];

  async function addEvent(data) {
    const e = await prisma.event.create({ data });
    createdEvents.push(e);
    return e;
  }

  // Organizer 1
  await addEvent({
    title: "Welcome Back Fair",
    description: "Campus clubs, music, and food trucks.",
    startsAt: daysFromNow(7),
    endsAt: hoursAfter(daysFromNow(7), 2),
    location: "Hall Building",
    type: "free",
    price: 0,
    capacity: 200,
    organizerId: organizer1.id,
    published: true,
    category: "Campus life",
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
    category: "Career development"
  });

  // Organizer 2
  await addEvent({
    title: "Full-Stack Coding Bootcamp",
    description: "Hands-on web dev workshop (HTML/CSS/JS).",
    startsAt: daysFromNow(14),
    endsAt: hoursAfter(daysFromNow(14), 6),
    location: "EV 12.221",
    type: "paid",
    price: 2500, // $25.00
    capacity: 50,
    organizerId: organizer2.id,
    published: true,
    category: "Career development"
  });
  await addEvent({
    title: "Tech Networking Night",
    description: "Meet startups, recruiters, and alumni in tech.",
    startsAt: daysFromNow(21),
    endsAt: hoursAfter(daysFromNow(21), 3),
    location: "JMSB Atrium",
    type: "free",
    price: 0,
    capacity: 120,
    organizerId: organizer2.id,
    published: false, // draft
    category: "Career development"
  });

  // Organizer 3
  await addEvent({
    title: "Hackathon 2025",
    description: "48-hour coding marathon with prizes & mentors.",
    startsAt: daysFromNow(30),
    endsAt: hoursAfter(daysFromNow(30), 48),
    location: "Conference Hall",
    type: "paid",
    price: 1500, // $15.00
    capacity: 300,
    organizerId: organizer3.id,
    published: true,
    category: "Campus life"
  });
  await addEvent({
    title: "Startup Pitch Night",
    description: "Entrepreneurs pitch ideas to judges & VCs.",
    startsAt: daysFromNow(40),
    endsAt: hoursAfter(daysFromNow(40), 4),
    location: "MB Auditorium",
    type: "paid",
    price: 1000, // $10.00
    capacity: 150,
    organizerId: organizer3.id,
    published: false, // draft
    category: "Career development"
  });
  await addEvent({
    title: "Summer Wrap-Up Social",
    description: "Casual mixer and snacks (past event).",
    startsAt: daysFromNow(-5),
    endsAt: hoursAfter(daysFromNow(-5), 2),
    location: "Loyola Quad",
    type: "free",
    price: 0,
    capacity: 80,
    organizerId: organizer3.id,
    published: true,
    category: "Campus life"
  });

  console.log("Creating tickets...");
  const id = Object.fromEntries(createdEvents.map((e) => [e.title, e.id]));

  await prisma.ticket.createMany({
    data: [
      { eventId: id["Welcome Back Fair"], userId: student1.id, qrToken: "QR-CASEY-WELCOME" },
      { eventId: id["Welcome Back Fair"], userId: student2.id, qrToken: "QR-JORDAN-WELCOME" },
      { eventId: id["Welcome Back Fair"], userId: organizer1.id, qrToken: "QR-ORG1-WELCOME" },

      { eventId: id["Career Development Workshop"], userId: student3.id, qrToken: "QR-TAYLOR-CAREER" },
      { eventId: id["Career Development Workshop"], userId: admin1.id, qrToken: "QR-ADMIN-CAREER" },

      { eventId: id["Full-Stack Coding Bootcamp"], userId: student1.id, qrToken: "QR-CASEY-BOOTCAMP" },
      { eventId: id["Full-Stack Coding Bootcamp"], userId: admin1.id, qrToken: "QR-ADMIN-BOOTCAMP" },

      { eventId: id["Tech Networking Night"], userId: student2.id, qrToken: "QR-JORDAN-NET" },

      { eventId: id["Hackathon 2025"], userId: student4.id, qrToken: "QR-SAM-HACK" },
      { eventId: id["Hackathon 2025"], userId: organizer2.id, qrToken: "QR-ORG2-HACK" },

      { eventId: id["Startup Pitch Night"], userId: student3.id, qrToken: "QR-TAYLOR-PITCH" },

      { eventId: id["Summer Wrap-Up Social"], userId: student1.id, qrToken: "QR-CASEY-SUMMER" },
      { eventId: id["Summer Wrap-Up Social"], userId: student2.id, qrToken: "QR-JORDAN-SUMMER" },
    ],
  });

  console.log("Seed complete");
}

main()
  .catch((err) => {
    console.error("Seed failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
