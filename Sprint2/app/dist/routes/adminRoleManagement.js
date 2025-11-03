"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoleManagement = void 0;
const express_1 = require("express");
const adminOnly_1 = require("../middleware/adminOnly");
const validation_1 = require("../validation");
const adminRoleManagementService_1 = require("../services/adminRoleManagementService");
exports.adminRoleManagement = (0, express_1.Router)();
exports.adminRoleManagement.post("/users/:id/role", adminOnly_1.adminOnly, async (req, res) => {
    const parsed = validation_1.setRoleBody.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    try {
        const newRole = await (0, adminRoleManagementService_1.setRole)({
            adminId: req.user.id,
            userId: req.params.id,
            role: parsed.data.role,
        });
        return res.json(newRole);
    }
    catch (e) {
        if (e.message === "NOT_FOUND")
            return res.status(404).json({ error: "User not found." });
        if (e.message === "LAST_ADMIN")
            return res.status(400).json({ error: "Can't demote thte last admin." });
        return res.status(500).json({ error: "Server error." });
    }
});
//# sourceMappingURL=adminRoleManagement.js.map