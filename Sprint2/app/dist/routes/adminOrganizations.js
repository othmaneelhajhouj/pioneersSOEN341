"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrganizations = void 0;
const express_1 = require("express");
const adminOnly_1 = require("../middleware/adminOnly");
const validation_1 = require("../validation");
const adminOrganizationsService_1 = require("../services/adminOrganizationsService");
exports.adminOrganizations = (0, express_1.Router)();
//lists organizations
exports.adminOrganizations.get("/organizations", adminOnly_1.adminOnly, async (req, res) => {
    const parsed = validation_1.orgListQuery.safeParse(req.query);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { take, cursor } = parsed.data;
    const rows = await (0, adminOrganizationsService_1.listOrgs)(take, cursor);
    return res.json({ data: rows, nextCursor: rows.at(-1)?.id ?? null });
});
//creates organization
exports.adminOrganizations.post("/organizations", adminOnly_1.adminOnly, async (req, res) => {
    const parsed = validation_1.orgCreateBody.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    try {
        const org = await (0, adminOrganizationsService_1.createOrg)(parsed.data);
        return res.status(200).json(org);
    }
    catch {
        return res.status(500).json({ error: "Server error" });
    }
});
//updates organization
exports.adminOrganizations.patch("/organizations/:id", adminOnly_1.adminOnly, async (req, res) => {
    const parsed = validation_1.orgUpdateBody.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    try {
        const org = await (0, adminOrganizationsService_1.updateOrg)({ id: req.params.id, ...parsed.data });
        return res.json(org);
    }
    catch {
        return res.status(404).json({ error: "Organization not found." });
    }
});
//delete organization
exports.adminOrganizations.delete("/organizations/:id", adminOnly_1.adminOnly, async (req, res) => {
    try {
        const org = await (0, adminOrganizationsService_1.deleteOrg)(req.params.id);
        return res.json(org);
    }
    catch (e) {
        if (e.message === "ORG_HAS_USERS")
            return res.status(400).json({ error: "Organization has assigned users." });
        return res.status(404).json({ error: "Organization not found." });
    }
});
//# sourceMappingURL=adminOrganizations.js.map