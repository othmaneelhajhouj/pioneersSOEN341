"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrg = createOrg;
exports.listOrgs = listOrgs;
exports.updateOrg = updateOrg;
exports.deleteOrg = deleteOrg;
const db_1 = require("../db");
async function createOrg({ name, description }) {
    return db_1.prisma.organization.create({ data: { name, description } });
}
async function listOrgs(take = 25, cursor) {
    return db_1.prisma.organization.findMany({
        orderBy: { createdAt: "asc" },
        take,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
}
async function updateOrg({ id, name, description }) {
    return db_1.prisma.organization.update({
        where: { id },
        data: { name, description },
    });
}
async function deleteOrg(id) {
    const memberCount = await db_1.prisma.user.count({ where: { organizationId: id } });
    if (memberCount > 0)
        throw new Error("ORG_HAS_USERS");
    return db_1.prisma.organization.delete({ where: { id } });
}
//# sourceMappingURL=adminOrganizationsService.js.map