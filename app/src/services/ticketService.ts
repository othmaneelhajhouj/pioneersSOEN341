import crypto from "node:crypto";
import {prisma} from "../db";

export async function claimTicket(opts: {eventId: string; userId: string}) {

    // Load a published event 
    const {eventId, userId} = opts;
    const ev = await prisma.event.findFirst({
        where: {id: eventId, published: true},
        select: {id: true, capacity: true, type: true},
    });

    if(!ev) {
        throw new Error("NOT_FOUND_OR_UNPUBLISHED");
    }

    let ticket:
        | {
            id: string;
            eventId: string;
            userId: string;
            qrToken: string;
            status: "claimed" | "used";
            claimedAt: Date;
          }
        | null = null;
    let alreadyHad = false;

    await prisma.$transaction(async(tx) => {

        //return ticket if user already has it
        const existing = await tx.ticket.findFirst({
            where: {eventId: ev.id, userId},
            select: {
                id: true,
                eventId: true,
                userId: true,
                qrToken: true,
                status: true,
                claimedAt: true,
            },
        });
        if (existing){
            ticket = existing;
            alreadyHad = true;
            return;
        }

        //check capacity
        const current = await tx.ticket.count({where: {eventId: ev.id}});
        if (current >= ev.capacity){
            throw new Error("FULL");
        }

        //create ticket via unique QR token
        const qrToken = crypto.randomBytes(16).toString("hex").toUpperCase();

        //ticket status defaults to claimed
        ticket = await tx.ticket.create({
            data: {
                eventId: ev.id,
                userId,
                qrToken, 
            },
            select: {
                id: true,
                eventId: true,
                userId: true,
                qrToken: true,
                status: true,
                claimedAt: true,
            },
        });
    });

    return {
        ticket: ticket!,
        alreadyHad,
        payment: ev.type === "paid" ? "accepted" : "free",
    };
}