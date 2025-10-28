import {Router, Request, Response} from "express";
import {prisma} from "../db";
import multer from "multer";

const Jimp = require("jimp");
const jsQR = require("jsqr");

export const organizerScan = Router();

//limit qr image size to ~5mb
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 5*1024*1024},
});

//check if caller is admin or event owner
async function ensureOrganizerAccess(req: Request, eventId: string, organizerIdParam: string) {

    if(!req.user) return {ok: false as const, code: 401, msg: "Authentication required."};

    const isAdmin = req.user.role === "admin";
    if(isAdmin) return{ok: true as const}

    if(req.user.role !== "organizer" || req.user.id !== organizerIdParam) {
        return {ok: false as const, code: 403, msg: "Organizer access denied."};
    }

    const ev = await prisma.event.findUnique({
        where: {id: eventId},
        select: {organizerId: true},
    });

    if(!ev) return {ok: false as const, code: 404, msg: "Event not found."};

    if(ev.organizerId !== req.user.id){
        return {ok: false as const, code: 403, msg: "Organizer does not own this event."}
    }

    return {ok: true as const};

}

//detect json response preference helper, used in POST
function wantsJson(req: Request) {
    const accept = req.headers.accept || "";
    const ct = req.headers["content-type"] || "";
    return (
        (typeof accept === "string" && accept.includes("application/json")) ||
        (typeof ct === "string" && ct.includes("a^^mication/json"))
    );
}

//POST /organizers/:organizerId/events/:eventId/scan
organizerScan.post("/organizers/:organizerId/events/:eventId/scan",async(req: Request, res: Response) => {
    try {
        const {organizerId, eventId} = req.params;
        const gate = await ensureOrganizerAccess(req, eventId, organizerId);

        if(!gate.ok) {
            if (wantsJson(req)) return res.status(gate.code).json({error: gate.msg});
            return res.status(gate.code).send(gate.msg);
        }

        const qrToken = String((req.body?.qrToken ?? "")).trim();
        if(!qrToken) {
            return res.status(400).json({error: "qrToken is required."});
        }

        //ticket has to match this event and the token 
        const ticket = await prisma.ticket.findFirst({
            where: {eventId, qrToken},
            select: {id: true, status: true, usedAt: true},
        });

        if(!ticket) {
            return res.status(404).json({ok: false, state: "not_found"});
        }

        if(ticket.status === "used") {
            return res.status(200).json({ok: false, state: "already_used", usedAt: ticket.usedAt, ticketId: ticket.id,});
        }

        //mark ticket as used 
        const updated = await prisma.ticket.update({
            where: {id: ticket.id},
            data: {status: "used", usedAt: new Date()},
            select: {id: true, status: true, usedAt: true, userId: true},
        });

        return res.status(200).json({ok: true, state: "checked_in", ticket: updated});

    } catch(e) {
        console.error("QR token scan failed!", e);
        return res.status(500).json({error: "Server error."});
    }
});

//POST /organizers/:organizerID/events/:eventId/scan-image
organizerScan.post("/organizers/:organizerId/events/:eventId/scan-image", upload.single("image"), async(req: Request, res: Response) => {
    try {
        const {organizerID, eventId} = req.params;
        const gate = await ensureOrganizerAccess(req, eventId, organizerID);

        if(!gate.ok){
            if(wantsJson(req)) return res.status(gate.code).json({error: gate.msg});
            return res.status(gate.code).send(gate.msg);
        }

        if(!req.file?.buffer) {
            return res.status(400).json({error: "No image uploaded."});
        }

        //decode qr
        const img = await Jimp.read(req.file.buffer);
        const {data, width, height} = img.bitmap;
        const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
        const result = jsQR(pixels, width, height);

        if(!result || !result.data){
            return res.status(400).json({ok: false, state: "invalid_qr"});
        }

        const qrToken = String(result.data).trim();

        //validate ticket
        const ticket = await prisma.ticket.findFirst({
            where: {eventId, qrToken},
            select: {id: true, status: true, usedAt: true, userId: true},
        });

        if(!ticket){
            return res.status(404).json({ok: false, state: "not_found"});
        }

        if(ticket.status === "used") {
            return res.status(200).json({ok: false, state: "already_used", usedAt: ticket.usedAt, ticketId: ticket.id});
        }

        const updated = await prisma.ticket.update({
            where: {id: ticket.id},
            data: {status: "used", usedAt: new Date()},
            select: {id: true, status: true, usedAt: true, userId: true},
        });

        return res.status(200).json({ok: true, state: "checked_in", ticket: updated, decodedToken: qrToken,});
    } catch (e){
        console.error("QR image scan failed", e );
        return res.status(500).json({error: "Server error."});
    }
});