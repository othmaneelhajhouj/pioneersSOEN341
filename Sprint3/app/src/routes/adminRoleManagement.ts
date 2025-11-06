import { Router, Request, Response } from "express";
import { adminOnly } from "../middleware/adminOnly";
import { setRoleBody } from "../validation";
import { setRole } from "../services/adminRoleManagementService";

export const adminRoleManagement = Router();

adminRoleManagement.post("/users/:id/role", adminOnly, async(req: Request, res: Response) => {
    const parsed = setRoleBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({error: parsed.error.flatten()});

    try{
        const newRole= await setRole({
            adminId: req.user!.id,
            userId: req.params.id,
            role: parsed.data.role,
        });
        return res.json(newRole);
    }catch(e: any){
        if(e.message === "NOT_FOUND") return res.status(404).json({error: "User not found."});
        if(e.message === "LAST_ADMIN") return res.status(400).json({error: "Can't demote thte last admin."});
        return res.status(500).json({error: "Server error."});
    }
});