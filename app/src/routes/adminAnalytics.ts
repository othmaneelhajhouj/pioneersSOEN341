import {Router, Request, Response} from "express";
import {adminOnly} from "../middleware/adminOnly";
import { getAdminAnalytics } from "../services/adminAnalyticsService";

export const adminAnalytics = Router();

adminAnalytics.get("/analytics", adminOnly, async(_req: Request, res: Response) => {
    try{
        const data = await getAdminAnalytics();
        return res.json(data);
    }catch (_e)
    {
        return res.status(500).json({error: "Server error."});
    }
});