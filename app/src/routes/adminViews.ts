import { Router, Request, Response } from "express";
import { adminOnly } from "../middleware/adminOnly";

export const adminViews = Router();

// Admin dashboard page
adminViews.get("/dashboard", adminOnly, (req: Request, res: Response) => {
    res.render("admin/dashboard");
});

// Analytics trends page
adminViews.get("/analytics", adminOnly, (req: Request, res: Response) => {
    res.render("admin/analytics");
});

// Events management page
adminViews.get("/events-manage", adminOnly, (req: Request, res: Response) => {
    res.render("admin/events");
});

// Organizers management page
adminViews.get("/organizers-manage", adminOnly, (req: Request, res: Response) => {
    res.render("admin/organizers");
});

// Organizations management page
adminViews.get("/organizations-manage", adminOnly, (req: Request, res: Response) => {
    res.render("admin/organizations");
});

// Users' role management page
adminViews.get("/users-manage", adminOnly, (req: Request, res: Response) => {
    res.render("admin/roleManagement");
});

// Redirects the bare /admin path to the main dashboard view so admins don't see a 404
adminViews.get("/", adminOnly, (_req, res) => {
  return res.redirect("/admin/dashboard");
});
