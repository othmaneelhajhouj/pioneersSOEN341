import {prisma} from "../db";

const PAGE_SIZE = 20;

export async function getUsers({
                                   role,
                                   search,
                                   cursor,
                               }: {
    role?: string;
    search?: string;
    cursor?: string;
}) {
    const where: any = {};

    if (role && role !== 'all') {
        where.role = role;
    }

    if (search) {
        where.OR = [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
        ];
    }

    const users = await prisma.user.findMany({
        where,
        take: PAGE_SIZE + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            organizerStatus: true,
            createdAt: true,
            organization: {
                select: {
                    id: true,
                    name: true,
                }
            },
            _count: {
                select: {
                    events: true,  // Changed from eventsOrganized
                    tickets: true,
                }
            }
        },
    });

    const hasMore = users.length > PAGE_SIZE;
    const data = hasMore ? users.slice(0, PAGE_SIZE) : users;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
        data,
        nextCursor,
    };
}

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
            },
        });
    } 