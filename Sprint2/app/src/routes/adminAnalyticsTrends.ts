import { Router, Request, Response } from "express";
import { adminOnly } from "../middleware/adminOnly";
import { trendsQuery } from "../validation";
import { getTrends } from "../services/adminAnalyticsTrendsService";

export const adminAnalyticsTrends = Router();

adminAnalyticsTrends.get("/analytics/trends", adminOnly, async(req: Request, res: Response) => {
    const parsed = trendsQuery.safeParse(req.query);
    if(!parsed.success) {
        return res.status(400).json({error: parsed.error.flatten()});
    }
    //if no to-from range provided, give last 30 days
    const now = parsed.data.to ?? new Date();
    const from = parsed.data.from ?? new Date(now.getTime() - 30*24*60*60*1000); // (time right now) - (30 days in ms)
    const to = parsed.data.to ?? now;
    const buckets = parsed.data.buckets;

    try{
        const data = await getTrends({from, to, buckets});
        return res.json({range: {from, to, buckets}, ...data}); //spread operator ... takes eventsCreated, ticketsIssued and ticketsUsed out of data and lists them after range
    } catch (e) {
        console.error(e); //for debug
        return res.status(500).json({error: "Server Error"});
    }
})