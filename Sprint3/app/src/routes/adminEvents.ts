import {Router, Request, Response} from "express";
import {adminOnly} from "../middleware/adminOnly";
import {listByModerationStatus, approveEvent, rejectEvent, publishEvent, unpublishEvent} from "../services/eventModerationService";
import { eventListQuery, eventDescisionBody } from "../validation";

export const adminEvents = Router();


//list events by moderation status 
adminEvents.get("/events", adminOnly, async (req: Request, res: Response) => {
    const parsed = eventListQuery.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }

    const {status, take, cursor} = parsed.data; 
    const rows = await listByModerationStatus(status as any, take, cursor);
    return res.json({
        data: rows,
        nextCursor: rows.at(-1)?.id ?? null //give cursor for next page as an id iff. last element of array is defined, otherwise give null
    });
});

//marks event as approved NOT pusblished yet 
adminEvents.post("/events/:id/approve", adminOnly, async(req: Request, res: Response) => {
    try{
        const ev = await approveEvent({eventId: req.params.id});
        return res.json(ev);
    }catch (e:any){
        if (e.code === "P2025") {     //prisma not found error code
            return res.status(404).json({error: "Event not found."});
        }
        
        return res.status(500).json({error: "Server error."});
    }
});

//marks event as rejected, stores reason, AND unpublishes by published=false
adminEvents.post("/events/:id/reject", adminOnly, async(req: Request, res: Response) => {
    const parsed = eventDescisionBody.safeParse(req.body);
    if(!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }

    try{
        const ev = await rejectEvent({
            eventId: req.params.id,
            reason: parsed.data.reason
        });
        return res.json(ev);
    }catch (e: any) {
        if(e.code === "P2025") {
            return res.status(404).json({error: "Event not found."});
        }
        return res.status(500).json({error: "Server error."});
    }
});

//publishes events iff. they were previously approved
adminEvents.post("/events/:id/publish", adminOnly, async (req: Request, res: Response) => {
    try {
        const ev = await publishEvent({eventId: req.params.id});
        return res.json(ev);
    } catch (e: any) {
        if (e.message === "NOT_APPROVED") {
            return res.status(400).json({error: "Event not approved."});
        }
        if (e.code === "P2025"){
            return res.status(404).json({error: "Event not found."});
        }
        return res.status(500).json({error: "Server error"});
    }
});

//unpublishes events (approved=false) regardless of approval
adminEvents.post("/events/:id/unpublish", adminOnly, async(req: Request, res: Response) => {
    try {
        const ev = await unpublishEvent({eventId: req.params.id});
        return res.json(ev);
    } catch (e: any) {
        if (e.code === "P2025") {
            return res.status(404).json({error: "Event not found."});
        }
        return res.status(500).json({error: "Server error"});
    }
});