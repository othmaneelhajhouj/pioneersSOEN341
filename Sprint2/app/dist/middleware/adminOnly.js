"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = adminOnly;
function adminOnly(req, res, next) {
    if (!req.user || req.user.role !== "admin")
        return res.status(403).json({ error: "Access denied: admin only" });
    next();
}
//# sourceMappingURL=adminOnly.js.map