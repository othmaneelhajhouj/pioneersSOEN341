"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listByModerationStatus = listByModerationStatus;
exports.approveEvent = approveEvent;
exports.rejectEvent = rejectEvent;
exports.publishEvent = publishEvent;
exports.unpublishEvent = unpublishEvent;
const db_1 = require("../db");
async function listByModerationStatus(status, take = 25, cursor) {
    return db_1.prisma.event.findMany({
        where: { moderationStatus: status },
        orderBy: { createdAt: "asc" },
        take,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}) //if cursor given skip 1 row
    });
}
//update event to approved
async function approveEvent({ eventId }) {
    return db_1.prisma.event.update({
        where: { id: eventId },
        data: {
            moderationStatus: "approved",
            moderationReason: null
        }
    });
}
//update event to rejected
async function rejectEvent({ eventId, reason }) {
    return db_1.prisma.event.update({
        where: { id: eventId },
        data: {
            moderationStatus: "rejected",
            moderationReason: reason,
            published: false
        }
    });
}
async function publishEvent({ eventId }) {
    const e = await db_1.prisma.event.findUnique({
        where: { id: eventId },
        select: { moderationStatus: true },
    });
    if (!e)
        throw new Error("NOT_FOUND");
    if (e.moderationStatus !== "approved")
        throw new Error("NOT_APPROVED");
    return db_1.prisma.event.update({
        where: { id: eventId },
        data: { published: true },
    });
}
async function unpublishEvent({ eventId }) {
    return db_1.prisma.event.update({
        where: { id: eventId },
        data: { published: false },
    });
}
//# sourceMappingURL=eventModerationService.js.map