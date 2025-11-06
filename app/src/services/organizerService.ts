import {prisma} from "../db";
import {OrganizerStatus, Role, Prisma} from "../../generated/prisma";

const SELECT_FIELDS = { //return these fields from db 
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  organizerStatus: true,
  approvedBy: true,
  approvedAt: true,
  decisionReason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const TRANSITIONS: Record<OrganizerStatus, OrganizerStatus[]> = { //allowed status transitions
  pending: ["approved", "denied"],
  approved: ["revoked"], 
  denied: ["approved"],
  revoked: ["approved"],
};

export async function listByStatus( //grabs a page (25) of organizer accoutns with approval status, ordered by creation time, optional cursor for more pages
  status: OrganizerStatus,
  take = 25,
  cursor?: string,
) {
  return prisma.user.findMany({
    where: { role: Role.organizer, organizerStatus: status },
    orderBy: { createdAt: "asc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}), //pagination logic: set iff. cursor given, skip 1 to not repeat last id of previous page
  });
}

interface SetStatusInput { //required status parameters
  adminId: string;
  userId: string;
  target: OrganizerStatus;
  reason?: string | null;
}

export async function setStatus({ // takes an object from setstatusinput, breaks it into 4 local variables
  adminId,
  userId,
  target,
  reason,
}: SetStatusInput) {    //get user info
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, organizerStatus: true },
  });

  if (!current || current.role !== Role.organizer) { //check if user received, if role valid
    throw new Error("NOT_FOUND");
  }

  if (!current.organizerStatus) {  //checks if status transition valid
    if (!["approved", "denied"].includes(target)) {
      throw new Error("INVALID_TRANSITION");
    }
  } else if (!TRANSITIONS[current.organizerStatus].includes(target)) {
    throw new Error("INVALID_TRANSITION");
  }

  const data: Prisma.UserUpdateInput = { //create data update object, needs to stay in the same shape as SetStatusInput
    organizerStatus: target,
    decisionReason: reason ?? null,
    approvedBy: target === "approved" ? adminId : null,
    approvedAt: target === "approved" ? new Date() : null,
  };

  return prisma.user.update({ //update with new data in data object
    where: { id: userId },
    data,
    select: SELECT_FIELDS,
  });
}
