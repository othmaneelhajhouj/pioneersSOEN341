"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAnalytics = void 0;
const express_1 = require("express");
const adminOnly_1 = require("../middleware/adminOnly");
const adminAnalyticsService_1 = require("../services/adminAnalyticsService");
exports.adminAnalytics = (0, express_1.Router)();
exports.adminAnalytics.get("/analytics", adminOnly_1.adminOnly, async (_req, res) => {
    try {
        const data = await (0, adminAnalyticsService_1.getAdminAnalytics)();
        return res.json(data);
    }
    catch (_e) {
        return res.status(500).json({ error: "Server error." });
    }
});
//# sourceMappingURL=adminAnalytics.js.map