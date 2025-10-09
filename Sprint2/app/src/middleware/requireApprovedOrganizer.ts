import {Request, Response, NextFunction} from "express";

export function requireApprovedOrganizer(
    req: Request,
    res: Response,
    next: NextFunction,
){
    if(!req.user){
        return res.status(401).json({error: "Authentication required."});
    }

    if(req.user.role === "admin") {
        return next();
    }

    if (req.user.role !== "organizer") {
        return res.status(403).json({error: "Organizer access required."});
    }

    if (req.user.organizerStatus !== "approved") {
        return res.status(403).json({error: "Organizer qpprovql required"});
    }

    next();

}