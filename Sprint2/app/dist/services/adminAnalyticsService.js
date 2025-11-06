"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminAnalytics = getAdminAnalytics;
const db_1 = require("../db");
async function getAdminAnalytics() {
    const [eventsTotal, eventsPublished, ticketsIssued, ticketsUsed, distinctParticipants,] = await Promise.all([
        db_1.prisma.event.count(),
        db_1.prisma.event.count({ where: { published: true } }),
        db_1.prisma.ticket.count(),
        db_1.prisma.ticket.count({ where: { status: "used" } }),
        db_1.prisma.ticket.findMany({ distinct: ["userId"], select: { userId: true } }),
    ]);
    return {
        eventsTotal,
        eventsPublished,
        ticketsIssued,
        ticketsUsed,
        participantsUnique: distinctParticipants.length,
    };
}
//# sourceMappingURL=adminAnalyticsService.js.map