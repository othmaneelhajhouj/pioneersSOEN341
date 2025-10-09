import {z} from "zod";

//this code is for validating incoming requests


//organizers
const organizerStatusEnum = z.enum(["pending", "approved", "denied", "revoked"]); 

export const organizerListQuery = z.object({
    status: organizerStatusEnum.default("pending"),
    take: z.coerce.number().int().min(1).max(100).default(25), 
    cursor: z.string().trim().min(1).optional(),
});

export const organizerDecisionBody = z.object({
    reason: z.string().trim().min(5, "Reason must be at least 5 characters long.").max(500).optional(),
});

const moderationStatusEnum = z.enum(["pending", "approved", "rejected"]);


//events
export const eventListQuery = z.object({
    status: moderationStatusEnum.default("pending"),
    take:z.coerce.number().int().min(1).max(100).default(25),
    cursor:z.string().trim().min(1).optional()
})

export const eventDescisionBody = z.object({
    reason: z.string().trim().min(5).max(500)
})


//trends
export const trendsQuery = z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    buckets: z.enum(["day", "week"]).default("day"),
});


//roles
export const roleEnum = z.enum(["student", "organizer", "admin"]);

export const setRoleBody = z.object({
    role: roleEnum,
});

//organizations
export const orgCreateBody = z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional(),
});

export const orgUpdateBody = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional(),
});

export const orgListQuery = z.object({
  take: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().trim().min(1).optional(),
});