const express = require("express");
const prisma = require("../lib/prisma");
const { wantsJson } = require("../utils/validation");

const router = express.Router();

const friendlyDate = new Intl.DateTimeFormat("en-CA", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const detailedDate = new Intl.DateTimeFormat("en-CA", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const upcomingRaw = await prisma.event.findMany({
      where: {
        published: true,
        startsAt: { gte: now },
      },
      orderBy: { startsAt: "asc" },
      take: 6,
      include: {
        organizer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { tickets: true },
        },
      },
    });

    const upcomingEvents = upcomingRaw.map((event) => {
      const organizerName = event.organizer
        ? [event.organizer.firstName, event.organizer.lastName].filter(Boolean).join(" ")
        : "Campus Organizer";

      return {
        id: event.id,
        title: event.title,
        location: event.location,
        startsAtISO: event.startsAt.toISOString(),
        startsAtFriendly: friendlyDate.format(event.startsAt),
        startsAtDetailed: detailedDate.format(event.startsAt),
        ticketCount: event._count.tickets,
        capacity: event.capacity,
        type: event.type,
        category: event.category,
        organizerName,
      };
    });

    if (wantsJson(req)) {
      return res.json({ data: { upcomingEvents } });
    }

    return res.render("home/index", {
      upcomingEvents,
      loadError: false,
    });
  } catch (err) {
    console.error("Homepage load failed", err);
    if (wantsJson(req)) {
      return res.status(500).json({ error: "Failed to load homepage." });
    }
    return res.status(500).render("home/index", { upcomingEvents: [], loadError: true });
  }
});

module.exports = router;
