import {prisma} from "../db";

export async function createOrg({name, description}: {name: string, description?: string})
{
    return prisma.organization.create({data: {name, description}});
}

export async function listOrgs(take = 25, cursor?: string) {
  return prisma.organization.findMany({
    orderBy: { createdAt: "asc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
}

export async function updateOrg({id, name, description}: {id: string, name?: string, description?: string}){
    return prisma.organization.update({
        where: {id},
        data: {name,description},
    });
}

export async function deleteOrg(id: string) {
    const memberCount = await prisma.user.count({where: {organizationId: id}});
    if (memberCount > 0) throw new Error("ORG_HAS_USERS");
    return prisma.organization.delete({where: {id}}) ;
}