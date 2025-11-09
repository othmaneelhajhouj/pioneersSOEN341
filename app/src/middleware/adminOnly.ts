import { Request, Response, NextFunction } from "express";
export function adminOnly(req: Request, res: Response, next: NextFunction)
{
    if(!req.user || req.user.role !== "admin") return res.status(403).json({error: "Access denied: admin only"});
    next();
}