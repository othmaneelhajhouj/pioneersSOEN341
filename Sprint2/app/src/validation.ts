import {z} from "zod";

const organizerStatusEnum = z.enum(["pending", "approved", "denied", "revoked"]); //use to validate that passed status values are exactly one of these 4

export const organizerListQuery = z.object({
    status: organizerStatusEnum.default("pending"),
    take: z.coerce.number().int().min(1).max(100).default(25), //convert "25" string to int between 1 and 100
    cursor: z.string().trim().min(1).optional(),
});

export const organizerDecisionBody = z.object({
    reason: z.string().trim().min(5, "Reason must be at least 5 characters long.").max(500).optional(),
});

const moderationStatusEnum = z.enum(["pending", "approved", "rejected"]);

export const eventListQuery = z.object({
    status: moderationStatusEnum.default("pending"),
    take:z.coerce.number().int().min(1).max(100).default(25),
    cursor:z.string().trim().min(1).optional()
})

export const eventDescisionBody = z.object({
    reason: z.string().trim().min(5).max(500)
})