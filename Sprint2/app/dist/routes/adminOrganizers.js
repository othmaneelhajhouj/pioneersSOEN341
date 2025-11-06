"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrganizers = void 0;
const express_1 = require("express");
const adminOnly_1 = require("../middleware/adminOnly");
const organizerService_1 = require("../services/organizerService");
const validation_1 = require("../validation");
exports.adminOrganizers = (0, express_1.Router)();
exports.adminOrganizers.get("/organizers", adminOnly_1.adminOnly, async (req, res) => {
    const parsed = validation_1.organizerListQuery.safeParse(req.query);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { status, take, cursor } = parsed.data;
    const rows = await (0, organizerService_1.listByStatus)(status, take, cursor);
    res.json({ data: rows, nextCursor: rows.at(-1)?.id ?? null });
});
for (const target of ["approved", "denied", "revoked"]) {
    exports.adminOrganizers.post(`/organizers/:id/${target}`, adminOnly_1.adminOnly, async (req, res) => {
        const parsed = validation_1.organizerDecisionBody.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: parsed.error.flatten() });
        try {
            const user = await (0, organizerService_1.setStatus)({
                adminId: req.user.id,
                userId: req.params.id,
                target,
                reason: parsed.data.reason,
            });
            res.json(user);
        }
        catch (e) {
            if (e.message === "NOT_FOUND")
                return res.status(404).json({ error: "User not found." });
            if (e.message === "INVALID_TRANSITION")
                return res.status(400).json({ error: "Invalid transition." });
            res.status(500).json({ error: "Server error" });
        }
    });
}
//# sourceMappingURL=adminOrganizers.js.map