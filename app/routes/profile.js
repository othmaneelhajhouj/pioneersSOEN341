const express = require("express");
const prisma = require("../lib/prisma");
const { wantsJson } = require("../utils/validation");

const router = express.Router();

// Protect profile routes because they rely on the signed in user.
function ensureAuthenticated(req, res, next) {
  if (req.user) return next();
  if (wantsJson(req)) {
    return res.status(401).json({ error: "Authentication required." });
  }
  const redirectTarget = encodeURIComponent(req.originalUrl || "/profile");
  return res.redirect(`/login?next=${redirectTarget}`);
}

router.get("/profile", ensureAuthenticated, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizerStatus: true,
        decisionReason: true,
        approvedAt: true,
      },
    });

    if (!user) {
      if (wantsJson(req)) return res.status(404).json({ error: "User not found." });
      return res.status(404).render("profile/index", { loadError: true });
    }

    const isAdmin = user.role === "admin";
    const isOrganizer = user.role === "organizer";
    const status = user.organizerStatus || null;
    const requested = req.query.requested === "1";
    const errorCode = req.query.error || null;

    const organizerRequest = {
      state: status,
      canRequest: false,
      buttonLabel: "Request organizer access",
      message: "",
    };

    if (isAdmin) {
      organizerRequest.message = "Admins already have full management access.";
    } else if (isOrganizer && status === "approved") {
      organizerRequest.message = "You're approved as an organizer. Head to My Events to start planning.";
    } else if (isOrganizer && status === "pending") {
      organizerRequest.message = "Your organizer request is under review. We'll notify you once it's approved.";
    } else if (isOrganizer && (status === "denied" || status === "revoked")) {
      organizerRequest.canRequest = true;
      organizerRequest.buttonLabel = "Reapply for organizer access";
      organizerRequest.message = status === "denied"
        ? "Your previous request was denied. You can reapply below."
        : "Your organizer access was revoked. You can reapply below.";
    } else {
      organizerRequest.canRequest = true;
      organizerRequest.message = "Want to host events? Submit a request and an administrator will review it.";
    }

    const payload = {
      user,
      requested,
      errorCode,
      organizerRequest,
    };

    if (wantsJson(req)) {
      return res.json({ data: payload });
    }

    return res.render("profile/index", payload);
  } catch (err) {
    console.error("Profile load failed", err);
    if (wantsJson(req)) return res.status(500).json({ error: "Failed to load profile." });
    return res.status(500).render("profile/index", {
      loadError: true,
    });
  }
});

router.post("/profile/organizer-request", ensureAuthenticated, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        role: true,
        organizerStatus: true,
      },
    });

    if (!user) {
      if (wantsJson(req)) return res.status(404).json({ error: "User not found." });
      return res.redirect("/profile?error=notfound");
    }

    if (user.role === "admin" || (user.role === "organizer" && user.organizerStatus === "approved")) {
      if (wantsJson(req)) return res.status(400).json({ error: "Organizer request not allowed." });
      return res.redirect("/profile?error=notallowed");
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        role: "organizer",
        organizerStatus: "pending",
        approvedAt: null,
        approvedBy: null,
        decisionReason: null,
      },
      select: {
        role: true,
        organizerStatus: true,
      },
    });

    if (req.user) {
      req.user.role = updated.role;
      req.user.organizerStatus = updated.organizerStatus || undefined;
    }

    if (wantsJson(req)) {
      return res.status(202).json({ ok: true, status: updated.organizerStatus });
    }

    return res.redirect("/profile?requested=1");
  } catch (err) {
    console.error("Organizer request failed", err);
    if (wantsJson(req)) return res.status(500).json({ error: "Failed to submit request." });
    return res.redirect("/profile?error=server");
  }
});

module.exports = router;
