const express = require('express');
const eventsController = require('../controllers/eventsController');

const router = express.Router();

// ==================== PUBLIC EVENT ROUTES ====================
// These routes are accessible to all students/users

// GET /events
// Display list of all published events available to students
router.get('/', eventsController.event_index_student);

// GET /events/:id
// Display details of a specific event for students
router.get('/:id', eventsController.event_details_student);

// GET /events/:id/ics
// Download ICS for a published event
router.get('/:id/ics', eventsController.event_ics);

module.exports = router;
