/**
 * MAIN APPLICATION FILE
 * Entry point for the Event Management System
 * Sets up Express server, middleware, routes, and error handling
 */

// Load environment variables first
require('dotenv').config();
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const { PrismaClient, OrganizerStatus } = require("./generated/prisma");
const crypto = require("crypto");
const QRCode = require('qrcode');
const {findSession,} = require("./lib/auth");

//ATTENTION: these requires will only work after you run "npm run build" once to create the /dist/ folder containing compiled JS files
const {adminOrganizers} = require("./dist/routes/adminOrganizers");
const {adminEvents} = require('./dist/routes/adminEvents');
const {adminAnalytics} = require('./dist/routes/adminAnalytics');
const {adminAnalyticsTrends} = require('./dist/routes/adminAnalyticsTrends');
const {adminRoleManagement} = require('./dist/routes/adminRoleManagement');
const {adminOrganizations} = require('./dist/routes/adminOrganizations');
const {adminViews} = require('./dist/routes/adminViews');
const {tickets} = require('./dist/routes/tickets');
const {organizerScan} = require('./dist/routes/organizerScan');

const {SERVER_PORT} = require('./utils/constants');
const app = express();
const secureCookies = process.env.NODE_ENV === "production";

// ==================== MIDDLEWARE ====================
// Serve static files (CSS, JS, images) from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Parse URL-encoded form data (from HTML forms)
app.use(express.urlencoded({extended: true}));

// Parse JSON request bodies (from API calls)
app.use(express.json());

// HTTP request logger for development
app.use(morgan('dev'));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

function parseCookies(header) {
  if (!header) return {};
  return header.split(";").reduce((acc, part) => {
    const index = part.indexOf("=");
    if (index === -1) return acc;
    const key = part.slice(0, index).trim();
    const value = decodeURIComponent(part.slice(index + 1).trim());
    if (key) acc[key] = value;
    return acc;
  }, {});
}

function getSessionToken(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies.session || null;
}

function wantsJson(req) {
  const accept = req.headers.accept || "";
  return typeof accept === "string" && accept.includes("application/json");
}

app.use((req, res, next) => {
  res.locals.currentUser = null;
  const token = getSessionToken(req);
  if (!token) {
    return next();
  }

  findSession(token)
    .then((session) => {
      if (!session) {
        res.clearCookie("session", {
          path: "/",
          sameSite: "lax",
          secure: secureCookies,
          httpOnly: true,
        });
        return next();
      }
      const user = session.user;
      req.sessionToken = token;
      req.session = {
        id: session.id,
        expiresAt: session.expiresAt,
      };
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizerStatus: user.organizerStatus || undefined,
      };
      res.locals.currentUser = req.user;
      return next();
    })
    .catch((err) => {
      console.error("Session lookup failed", err);
      if (wantsJson(req)) {
        return res.status(500).json({ error: "Authentication check failed." });
      }
      return res.status(500).send("Authentication check failed.");
    });
});

// Authentication routes
app.use("/", require("./routes/auth"));
app.use("/", require("./routes/home"));
app.use("/", require("./routes/profile"));
app.use("/", require("./routes/myEvents"));

// Public event routes (for students viewing events)
app.use("/events", require("./routes/events.public"));

// Organizer event routes (for creating and managing events)
app.use("/organizers", require("./routes/events.organizer"));


//all the ones that say compiled only work after npm run build x1
//mount compiled adminOrganizers router 
app.use('/admin', adminOrganizers);

//mount compiled adminEvents router
app.use('/admin', adminEvents);

//mount compiled adminAnalytics router
app.use('/admin', adminAnalytics);

//mount compiled adminAnalyticsTrends router
app.use('/admin', adminAnalyticsTrends);

//mount compiled adminRoleManagement router
app.use('/admin', adminRoleManagement);

//mount compiled adminOrganizations router
app.use('/admin', adminOrganizations);

// mount admin view routes for dashboard pages
app.use('/admin', adminViews);

//mount compiled adminViews router
app.use('/admin', adminViews);

//mount compiled tickets router
app.use('/', tickets);

//mount compiled organizerScan router
app.use('/', organizerScan);

//adminViews router
const { adminViews } = require('./dist/routes/adminViews');
app.use('/admin', adminViews);


//endpoint to check server health
app.get('/health', (_req, res) => res.json({ok: true}));

// 404 - Route not found
app.use((_req, res) => {
  res.status(404).send();
});

// ==================== START SERVER ====================
app.listen(SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${SERVER_PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
