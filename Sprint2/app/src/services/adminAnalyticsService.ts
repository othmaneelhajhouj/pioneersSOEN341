import { prisma } from "../db";

export async function getAdminAnalytics() {
    const [
        eventsTotal,
        eventsPublished,
        ticketsIssued,
        ticketsUsed,
        distinctParticipants,
    ] = await Promise.all([
        prisma.event.count(),
        prisma.event.count({where: {published: true}}),
        prisma.ticket.count(),
        prisma.ticket.count({where: {status: "used"}}),
        prisma.ticket.findMany({distinct:["userId"], select: {userId: true}}),
    ]);

    return {
        eventsTotal,
        eventsPublished,
        ticketsIssued,
        ticketsUsed,
        participantsUnique: distinctParticipants.length,
    };
}