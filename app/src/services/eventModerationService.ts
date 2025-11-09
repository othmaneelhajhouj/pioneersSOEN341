import {$Enums} from "../../generated/prisma";
import {prisma} from "../db";

export async function listByModerationStatus(
    status: $Enums.ModerationStatus,
    take = 25,
    cursor?: string
) {
    return prisma.event.findMany({
        where: {moderationStatus: status},
        orderBy: {createdAt: "asc"},
        take,
        ...(cursor ? {skip: 1, cursor: {id: cursor}}: {}) //if cursor given skip 1 row
    });
}

//update event to approved
export async function approveEvent({eventId}: {
    eventId: string
}) {
    return prisma.event.update({
        where: {id: eventId},
        data: {
            moderationStatus: "approved",
            moderationReason: null
        }
    });
}

//update event to rejected
export async function rejectEvent({eventId, reason}: {
    eventId: string;
    reason: string
}) {
    return prisma.event.update({
        where: {id: eventId},
        data: {
            moderationStatus: "rejected",
            moderationReason: reason,
            published: false
        }
    })
}

export async function publishEvent({eventId}: {
    eventId: string
}) {
    const e = await prisma.event.findUnique(
        {
            where: {id: eventId},
            select: {moderationStatus: true},
        }
    );

    if (!e) throw new Error("NOT_FOUND");
    if(e.moderationStatus !== "approved") throw new Error("NOT_APPROVED");

    return prisma.event.update(
        {
            where: {id: eventId},
            data: {published: true},
        }
    );
}

export async function unpublishEvent({eventId}: {
    eventId: string
}) {
    return prisma.event.update({
        where: {id: eventId},
        data: {published: false},
    });
}