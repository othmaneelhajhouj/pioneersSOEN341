import {Router, Request, Response} from "express";
import {adminOnly} from "../middleware/adminOnly";
import {listByStatus, setStatus} from "../services/organizerService";
import {organizerListQuery, organizerDecisionBody} from "../validation";

export const adminOrganizers = Router();

adminOrganizers.get("/organizers", adminOnly, async(req: Request,res: Response) => {
    const parsed = organizerListQuery.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({error: parsed.error.flatten()});

    const {status, take, cursor} = parsed.data;
    const rows = await listByStatus(status as any, take, cursor);
    res.json({data: rows, nextCursor: rows.at(-1)?.id ?? null});
});


for(const target of ["approved", "denied", "revoked"] as const) {
    adminOrganizers.post(`/organizers/:id/${target}`, adminOnly, async(req: Request, res: Response) => { //works for any status approved/denied/revoked because of ${target}
        const parsed = organizerDecisionBody.safeParse(req.body);
        if(!parsed.success) return res.status(400).json({error: parsed.error.flatten()})

        try {
            const user = await setStatus({
                adminId: req.user!.id,
                userId: req.params.id,
                target,
                reason: parsed.data.reason,
            });

            res.json(user);
        }catch(e: any){
            if(e.message === "NOT_FOUND") return res.status(404).json({error: "User not found."});
            if(e.message === "INVALID_TRANSITION") return res.status(400).json({error: "Invalid transition."});
            res.status(500).json({error: "Server error"});
        }
    });
}











