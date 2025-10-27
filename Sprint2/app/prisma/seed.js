const { PrismaClient } = require("generated-prisma/client");
const prisma = new PrismaClient()

async function main() {
  // Reset existing data to keep the seed unchanged during local development
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Seed an organization
  const org = await prisma.organization.create({
    data: {
      name: "CS Club",
      description: "Computer science society",
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: "student@example.com",
      firstName: "Casey",
      lastName: "Doe",
      role: "student",

    },
  });

  const organizerUser = await prisma.user.create({
    data: {
      email: "organizer@example.com",
      firstName: "Alex",
      lastName: "Smith",
      role: "organizer",
      organizationId: org.id,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      firstName: "Brad",
      lastName: "Pitt",
      role: "admin",
    },
  });

  const event = await prisma.event.create({
    data: {
      title: "Welcome Back Fair",
      description: "Kick off the semester with campus clubs, music, and food trucks.",
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      location: "Hall Building",
      type: "free",
      price: null,
      capacity: 200,
      organizerId: organizerUser.id,
      tickets: {
        create: [
          {
            userId: studentUser.id,
            qrToken: "QR-STUDENT-DEMO",
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      eventId: event.id,
      userId: organizerUser.id,
      qrToken: "QR-ORGANIZER-DEMO",
    },
  });

  console.log("Database seeded with demo users, event, and tickets.");
}

main()
  .catch((error) => {
    console.error("Failed to seed database", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
