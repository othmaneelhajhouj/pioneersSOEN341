const express = require("express");
const prisma = require("../lib/prisma");
const { wantsJson } = require("../utils/validation");

const router = express.Router();

// Simple guard: students need to be logged in to view their tickets.
function requireAuth(req, res, next) {
  if (req.user) return next();
  if (wantsJson(req)) return res.status(401).json({ error: "Authentication required." });
  const nextUrl = encodeURIComponent(req.originalUrl || "/my-events");
  return res.redirect(`/login?next=${nextUrl}`);
}

router.get("/my-events", requireAuth, async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId: req.user.id },
      orderBy: { claimedAt: "desc" },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            startsAt: true,
            endsAt: true,
            location: true,
            published: true,
            _count: { select: { tickets: true } },
          },
        },
      },
    });

    const formatter = new Intl.DateTimeFormat("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const entries = tickets.map((ticket) => {
      const event = ticket.event;
      if (!event) return null;
      return {
        ticketId: ticket.id,
        status: ticket.status,
        claimedAt: ticket.claimedAt,
        usedAt: ticket.usedAt,
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          location: event.location,
          startsAtFormatted: formatter.format(event.startsAt),
          ticketsClaimed: event._count?.tickets ?? 0,
        },
      };
    }).filter(Boolean);

    if (wantsJson(req)) {
      return res.json({ data: entries });
    }

    return res.render("student/my-events", {
      entries,
      active: "my-events",
    });
  } catch (err) {
    console.error("Failed to load student events", err);
    if (wantsJson(req)) return res.status(500).json({ error: "Failed to load events." });
    return res.status(500).render("student/my-events", {
      entries: [],
      active: "my-events",
      loadError: true,
    });
  }
});

module.exports = router;
