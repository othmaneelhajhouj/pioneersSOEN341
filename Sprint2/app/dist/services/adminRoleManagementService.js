"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminCount = getAdminCount;
exports.setRole = setRole;
const db_1 = require("../db");
async function getAdminCount() {
    return db_1.prisma.user.count({ where: { role: "admin" } });
}
async function setRole({ adminId, userId, role, }) {
    const user = await db_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });
    if (!user)
        throw new Error("NOT_FOUND");
    if (user.role === "admin" && role !== "admin") //if target user is an admin and we are trying to set a new role that is not admin
     {
        const admins = await getAdminCount();
        if (admins <= 1)
            throw new Error("LAST_ADMIN"); //guards against removing all admins
    }
    return db_1.prisma.user.update({
        where: { id: userId },
        data: {
            role,
        },
    });
}
//# sourceMappingURL=adminRoleManagementService.js.map