"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAnalyticsTrends = void 0;
const express_1 = require("express");
const adminOnly_1 = require("../middleware/adminOnly");
const validation_1 = require("../validation");
const adminAnalyticsTrendsService_1 = require("../services/adminAnalyticsTrendsService");
exports.adminAnalyticsTrends = (0, express_1.Router)();
exports.adminAnalyticsTrends.get("/analytics/trends", adminOnly_1.adminOnly, async (req, res) => {
    const parsed = validation_1.trendsQuery.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }
    //if no to-from range provided, give last 30 days
    const now = parsed.data.to ?? new Date();
    const from = parsed.data.from ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // (time right now) - (30 days in ms)
    const to = parsed.data.to ?? now;
    const buckets = parsed.data.buckets;
    try {
        const data = await (0, adminAnalyticsTrendsService_1.getTrends)({ from, to, buckets });
        return res.json({ range: { from, to, buckets }, ...data }); //spread operator ... takes eventsCreated, ticketsIssued and ticketsUsed out of data and lists them after range
    }
    catch (e) {
        console.error(e); //for debug
        return res.status(500).json({ error: "Server Error" });
    }
});
//# sourceMappingURL=adminAnalyticsTrends.js.map