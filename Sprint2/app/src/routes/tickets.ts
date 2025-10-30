import {Router, Request, Response} from "express";
import {claimTicket} from "../services/ticketService";
import {prisma} from "../db";
import QRCode from "qrcode";

export const tickets = Router(); 

function wantsJson(req: Request)
{
    const accept = req.headers.accept || "";
    const ct = req.headers["content-type"] || "";
    return (
        typeof accept === "string" && accept.includes("application/json")
    ) || (typeof ct === "string" && ct.includes("application/json"));
}

// POST /events/:id/tikcets/claim: student ticket claim
tickets.post("/events/:id/tickets/claim", async (req: Request, res: Response) => {
    try{
        if(!req.user)
        {
            return res.status(401).json({error: "Authentication required."});
        }

        const {id: userId} = req.user!;
        const eventId = req.params.id;
        const result = await claimTicket({eventId, userId});

        if(wantsJson(req)) {
            return res.status(result.alreadyHad ? 200 : 201).json({ok: true, ...result});
        }

        //redirect user  after claim 
        return res.redirect(`/events/${eventId}?claimed=1`);
    } catch (e: any) {
        if(e?.message === "NOT_FOUND_OR_UNPUBLISHED"){
            if(wantsJson(req)) return res.status(404).json({error: "Event not found or not published."});
            return res.redirect(`/events/${req.params.id}?error=notfound`);
        }
        if (e?.message === "FULL") {
            if (wantsJson(req)) return res.status(409).json({error: "Event is at capacity."});
            return res.redirect(`/events/${req.params.id}?full=1`);
        }

        console.error("Tickets claim failed:", e);
        if(wantsJson(req)) return res.status(500).json({error: "Failed to claim ticket."});
        return res.redirect(`/events/${req.params.id}?error=1`);
    }
});

//GET /tickets/:id/ : return caller's ticket details (owner/admin)
tickets.get("/tickets/:id", async(req: Request, res: Response) => {
    try {
        if(!req.user){
            return res.status(401).json({error: "Authentication required."});
        }
        const ticketId = req.params.id;
        const isAdmin = req.user.role === "admin";
        const ticket = await prisma.ticket.findFirst({
            where: isAdmin ? {id: ticketId}: {id: ticketId, userId: req.user.id},
            select: {
                id: true,
                userId: true,
                eventId: true,
                qrToken: true,
                status: true,
                claimedAt: true, 
                usedAt: true,
                event: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        startsAt: true,
                        endsAt: true,
                        location: true,
                    },
                },
            },
        });

        if(!ticket){
            return res.status(404).json({error: "Ticket not found"});
        }

        return res.json({ticket});
    } catch (e) {
        console.error("Get ticket failed:", e);
        return res.status(500).json({error: "Server error."});
    }
});

//GET /tickets/:id/qr : return png file of qr code
tickets.get("/tickets/:id/qr", async(req: Request, res: Response) => {
    try{
        if(!req.user){
            return res.status(401).json({error: "Authentication required."});
        }

        const  ticketId = req.params.id;
        const isAdmin = req.user.role === "admin";
        const t = await prisma.ticket.findFirst({
            where : isAdmin ? {id: ticketId} : {id: ticketId, userId: req.user.id}, //if admin fetch any ticket with that id, if not only fetch tickets owned by user
            select: {qrToken: true},
        });

        if(!t){
            return res.status(404).json({error: "Ticket not found"});
        }

        //qr code generate png
        const size = Math.max(128, Math.min(1024, Number(req.query.size) || 256)) //size = height = width is between 128 and 1024, 256 by default
        const png = await QRCode.toBuffer(t.qrToken, {
            type: "png",
            width: size,
            margin: 1,
            errorCorrectionLevel: "M",
        });

        res.setHeader("Content-Type", "image/png");
        return res.status(200).send(png);
    } catch (e) {
        console.error("QR render failed:", e);
        return res.status(500).json({error: "Failed to generate QR."});
    }
});