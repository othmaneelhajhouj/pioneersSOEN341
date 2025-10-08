/**
 * MAIN APPLICATION FILE
 * Entry point for the Event Management System
 * Sets up Express server, middleware, routes, and error handling
 */

const path = require('path');
const express = require('express');
const morgan = require('morgan');
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

// Public event routes (for students viewing events)
app.use("/events", require("./routes/events.public"));

// Organizer event routes (for creating and managing events)
app.use("/organizers", require("./routes/events.organizer"));

// 404 - Route not found
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ==================== START SERVER ====================
app.listen(SERVER_PORT, () => {
  console.log(`Server running on http://localhost:${SERVER_PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});