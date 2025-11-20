const express = require('express');
const eventsController = require('../controllers/eventsController');
const requireLogin = require('../middlewares/requireLogin')

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

// POST /events/:id/payments
// Simulate checkout and confirm ticket purchase for paid events
router.post('/:id/payments', requireLogin, eventsController.event_purchase_ticket);

module.exports = router;
