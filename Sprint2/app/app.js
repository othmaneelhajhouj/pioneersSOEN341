/**
 * MAIN APPLICATION FILE
 * Entry point for the Event Management System
 * Sets up Express server, middleware, routes, and error handling
 */

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const { PrismaClient, OrganizerStatus } = require("generated-prisma/client");
const crypto = require("crypto");
const QRCode = require('qrcode');

//ATTENTION: these requires will only work after you run "npm run build" once to create the /dist/ folder containing compiled JS files
const {adminOrganizers} = require("./dist/routes/adminOrganizers");
const {adminEvents} = require('./dist/routes/adminEvents');
const {adminAnalytics} = require('./dist/routes/adminAnalytics');
const { adminAnalyticsTrends } = require('./dist/routes/adminAnalyticsTrends');
const { adminRoleManagement } = require('./dist/routes/adminRoleManagement');
const { adminOrganizations } = require('./dist/routes/adminOrganizations');

const eventRoutes = require('./routes/events.public')

const { SERVER_PORT } = require('./utils/constants');
const app = express();

// ==================== MIDDLEWARE ====================
// Serve static files (CSS, JS, images) from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Parse URL-encoded form data (from HTML forms)
app.use(express.urlencoded({ extended: true }));

// Parse JSON request bodies (from API calls)
app.use(express.json());

// HTTP request logger for development
app.use(morgan('dev'));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

//Temp auth to pass middleware (adminOnly for now), replace with real auth later
app.use((req, _res, next) => {
    req.user = {id: 'admin-1', role: 'admin', organizerStatus:'approved'};
    next();
});

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

//endpoint to check server health
app.get('/health', (_req, res) => res.json({ok: true}));


//all the ones that say compiled only work after npm run build x1
//endpoint to check server health

// 404 - Route not found
app.use((req, res) => {
  res.status(404).send();
});

// ==================== START SERVER ====================
app.listen(SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${SERVER_PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
