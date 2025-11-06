"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApprovedOrganizer = requireApprovedOrganizer;
function requireApprovedOrganizer(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required." });
    }
    if (req.user.role === "admin") {
        return next();
    }
    if (req.user.role !== "organizer") {
        return res.status(403).json({ error: "Organizer access required." });
    }
    if (req.user.organizerStatus !== "approved") {
        return res.status(403).json({ error: "Organizer approval required" });
    }
    next();
}
//# sourceMappingURL=requireApprovedOrganizer.js.map