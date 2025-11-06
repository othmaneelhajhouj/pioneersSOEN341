"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminEvents = void 0;
const express_1 = require("express");
const adminOnly_1 = require("../middleware/adminOnly");
const eventModerationService_1 = require("../services/eventModerationService");
const validation_1 = require("../validation");
exports.adminEvents = (0, express_1.Router)();
//list events by moderation status 
exports.adminEvents.get("/events", adminOnly_1.adminOnly, async (req, res) => {
    const parsed = validation_1.eventListQuery.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { status, take, cursor } = parsed.data;
    const rows = await (0, eventModerationService_1.listByModerationStatus)(status, take, cursor);
    return res.json({
        data: rows,
        nextCursor: rows.at(-1)?.id ?? null //give cursor for next page as an id iff. last element of array is defined, otherwise give null
    });
});
//marks event as approved NOT pusblished yet 
exports.adminEvents.post("/events/:id/approve", adminOnly_1.adminOnly, async (req, res) => {
    try {
        const ev = await (0, eventModerationService_1.approveEvent)({ eventId: req.params.id });
        return res.json(ev);
    }
    catch (e) {
        if (e.code === "P2025") { //prisma not found error code
            return res.status(404).json({ error: "Event not found." });
        }
        return res.status(500).json({ error: "Server error." });
    }
});
//marks event as rejected, stores reason, AND unpublishes by published=false
exports.adminEvents.post("/events/:id/reject", adminOnly_1.adminOnly, async (req, res) => {
    const parsed = validation_1.eventDescisionBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    try {
        const ev = await (0, eventModerationService_1.rejectEvent)({
            eventId: req.params.id,
            reason: parsed.data.reason
        });
        return res.json(ev);
    }
    catch (e) {
        if (e.code === "P2025") {
            return res.status(404).json({ error: "Event not found." });
        }
        return res.status(500).json({ error: "Server error." });
    }
});
//publishes events iff. they were previously approved
exports.adminEvents.post("/events/:id/publish", adminOnly_1.adminOnly, async (req, res) => {
    try {
        const ev = await (0, eventModerationService_1.publishEvent)({ eventId: req.params.id });
        return res.json(ev);
    }
    catch (e) {
        if (e.message === "NOT_APPROVED") {
            return res.status(400).json({ error: "Event not approved." });
        }
        if (e.code === "P2025") {
            return res.status(404).json({ error: "Event not found." });
        }
        return res.status(500).json({ error: "Server error" });
    }
});
//unpublishes events (approved=false) regardless of approval
exports.adminEvents.post("/events/:id/unpublish", adminOnly_1.adminOnly, async (req, res) => {
    try {
        const ev = await (0, eventModerationService_1.unpublishEvent)({ eventId: req.params.id });
        return res.json(ev);
    }
    catch (e) {
        if (e.code === "P2025") {
            return res.status(404).json({ error: "Event not found." });
        }
        return res.status(500).json({ error: "Server error" });
    }
});
//# sourceMappingURL=adminEvents.js.map