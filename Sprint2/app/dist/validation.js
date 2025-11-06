"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgListQuery = exports.orgUpdateBody = exports.orgCreateBody = exports.setRoleBody = exports.roleEnum = exports.trendsQuery = exports.eventDescisionBody = exports.eventListQuery = exports.organizerDecisionBody = exports.organizerListQuery = void 0;
const zod_1 = require("zod");
//this code is for validating incoming requests
//organizers
const organizerStatusEnum = zod_1.z.enum(["pending", "approved", "denied", "revoked"]);
exports.organizerListQuery = zod_1.z.object({
    status: organizerStatusEnum.default("pending"),
    take: zod_1.z.coerce.number().int().min(1).max(100).default(25),
    cursor: zod_1.z.string().trim().min(1).optional(),
});
exports.organizerDecisionBody = zod_1.z.object({
    reason: zod_1.z.string().trim().min(5, "Reason must be at least 5 characters long.").max(500).optional(),
});
const moderationStatusEnum = zod_1.z.enum(["pending", "approved", "rejected"]);
//events
exports.eventListQuery = zod_1.z.object({
    status: moderationStatusEnum.default("pending"),
    take: zod_1.z.coerce.number().int().min(1).max(100).default(25),
    cursor: zod_1.z.string().trim().min(1).optional()
});
exports.eventDescisionBody = zod_1.z.object({
    reason: zod_1.z.string().trim().min(5).max(500)
});
//trends
exports.trendsQuery = zod_1.z.object({
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    buckets: zod_1.z.enum(["day", "week"]).default("day"),
});
//roles
exports.roleEnum = zod_1.z.enum(["student", "organizer", "admin"]);
exports.setRoleBody = zod_1.z.object({
    role: exports.roleEnum,
});
//organizations
exports.orgCreateBody = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100),
    description: zod_1.z.string().trim().max(500).optional(),
});
exports.orgUpdateBody = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100).optional(),
    description: zod_1.z.string().trim().max(500).optional(),
});
exports.orgListQuery = zod_1.z.object({
    take: zod_1.z.coerce.number().int().min(1).max(100).default(25),
    cursor: zod_1.z.string().trim().min(1).optional(),
});
//# sourceMappingURL=validation.js.map