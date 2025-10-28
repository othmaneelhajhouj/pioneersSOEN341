import {Router, Request, Response} from "express";
import { claimTicket } from "../services/ticketService";

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