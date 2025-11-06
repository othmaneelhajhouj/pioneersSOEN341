import {prisma} from "../db";

export async function getAdminCount()
{
    return prisma.user.count({where: {role: "admin"}});
}

export async function setRole({adminId, userId, role,} :
    {
    adminId: string;
    userId: string;
    role: "student" | "organizer" | "admin";
    }) {
        const user = await prisma.user.findUnique({
            where: {id: userId},
            select: {id: true, role: true},
        });

        if(!user) throw new Error("NOT_FOUND");

        if(user.role === "admin" && role !== "admin")    //if target user is an admin and we are trying to set a new role that is not admin
        {
            const admins = await getAdminCount();
            if (admins <= 1) throw new Error("LAST_ADMIN") //guards against removing all admins
        }

        return prisma.user.update({
            where: {id: userId},
            data: {
                role,
                organizerStatus: role === "organizer" ? "pending" : null,
                ...(role !== "organizer" ? {
                    approvedBy: null,
                    approvedAt: null,
                    decisionReason: null
                }: {}),
            },
        });
    } 