import { Router, Request, Response } from "express";
import { adminOnly } from "../middleware/adminOnly";
import { orgCreateBody, orgUpdateBody, orgListQuery } from "../validation";
import { createOrg, listOrgs, updateOrg, deleteOrg } from "../services/adminOrganizationsService";

export const adminOrganizations = Router();

//lists organizations
adminOrganizations.get("/organizations", adminOnly, async(req: Request, res: Response) => {
    const parsed = orgListQuery.safeParse(req.query);
    if(!parsed.success) return res.status(400).json({error: parsed.error.flatten()});
    
    const {take, cursor} = parsed.data;
    const rows = await listOrgs(take, cursor);
    return res.json({data: rows, nextCursor: rows.at(-1)?.id ?? null});
})

//creates organization
adminOrganizations.post("/organizations", adminOnly, async(req: Request, res: Response) => {
    const parsed = orgCreateBody.safeParse(req.body);
    if(!parsed.success) return res.status(400).json({error: parsed.error.flatten()});

    try {
        const org = await createOrg(parsed.data);
        return res.status(200).json(org);
    } catch {
        return res.status(500).json({error: "Server error"});
    } 
});

//updates organization
adminOrganizations.patch("/organizations/:id", adminOnly, async(req: Request, res: Response) => {
    const parsed = orgUpdateBody.safeParse(req.body);
    if(!parsed.success) return res.status(400).json({error: parsed.error.flatten()});

    try{
        const org = await updateOrg({id: req.params.id, ...parsed.data});
        return res.json(org);
    }catch {
        return res.status(404).json({error: "Organization not found."});
    }
});

//delete organization
adminOrganizations.delete("/organizations/:id", adminOnly, async (req: Request, res: Response) => {
    try{
        const org = await deleteOrg(req.params.id);
        return res.json(org);
    } catch (e: any) {
        if (e.message === "ORG_HAS_USERS") return res.status(400).json({error: "Organization has assigned users."});
        return res.status(404).json({error: "Organization not found."});
    }
});