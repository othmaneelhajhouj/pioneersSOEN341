"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listByStatus = listByStatus;
exports.setStatus = setStatus;
const db_1 = require("../db");
const prisma_1 = require("../../generated/prisma");
const SELECT_FIELDS = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    organizerStatus: true,
    approvedBy: true,
    approvedAt: true,
    decisionReason: true,
    createdAt: true,
    updatedAt: true,
};
const TRANSITIONS = {
    pending: ["approved", "denied"],
    approved: ["revoked"],
    denied: ["approved"],
    revoked: ["approved"],
};
async function listByStatus(//grabs a page (25) of organizer accoutns with approval status, ordered by creation time, optional cursor for more pages
status, take = 25, cursor) {
    return db_1.prisma.user.findMany({
        where: { role: prisma_1.Role.organizer, organizerStatus: status },
        orderBy: { createdAt: "asc" },
        take,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}), //pagination logic: set iff. cursor given, skip 1 to not repeat last id of previous page
    });
}
async function setStatus({ // takes an object from setstatusinput, breaks it into 4 local variables
adminId, userId, target, reason, }) {
    const current = await db_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, organizerStatus: true },
    });
    if (!current || current.role !== prisma_1.Role.organizer) { //check if user received, if role valid
        throw new Error("NOT_FOUND");
    }
    if (!TRANSITIONS[current.organizerStatus].includes(target)) { //checks if requested transition valid
        throw new Error("INVALID_TRANSITION");
    }
    const data = {
        organizerStatus: target,
        decisionReason: reason ?? null,
        approvedBy: target === "approved" ? adminId : null,
        approvedAt: target === "approved" ? new Date() : null,
    };
    return db_1.prisma.user.update({
        where: { id: userId },
        data,
        select: SELECT_FIELDS,
    });
}
//# sourceMappingURL=organizerService.js.map