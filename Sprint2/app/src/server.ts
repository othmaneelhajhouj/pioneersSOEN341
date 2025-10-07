import express from "express"
import {adminOrganizers} from "./routes/adminOrganizers";

//declare req.user as global type and its fields
declare global {
    namespace Express {interface Request {user?: {
        id: string; 
        role: "student" | "organizer" | "admin";
        organizerStatus?: "pending"|"approved"|"denied"|"revoked"}}}
}

const app = express();

app.use(express.json()); //json data parsing

app.use((req, _res, next) => {  //temp auth for development, change to real auth w login token decode later
    req.user = {
        id: "admin-1", 
        role: "admin",
        organizerStatus: "approved",
    };
    next();
});

app.get("/health", (_req, res) => res.json({ok: true})); //quick server test
app.use("/admin", adminOrganizers);
app.listen(3000, () => console.log("API on port: 3000"));