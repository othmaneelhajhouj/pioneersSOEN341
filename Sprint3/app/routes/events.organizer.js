/**
 * ORGANIZER ROUTES
 * All routes for organizers to manage their events
 * Base path: /organizers/:organizerId/events
 */

const express = require('express');
const eventsController = require('../controllers/eventsController');
const checkOrganizerPermissions = require('../middlewares/eventPermissionChecker');

const router = express.Router();

// ==================== MIDDLEWARE ====================
// Apply organizer permission check to all routes with /:organizerId
// This validates that the user has permission to access organizer routes
// and makes the organizerId available in req.organizerId for all handlers
router.use('/:organizerId', checkOrganizerPermissions({ from: 'params' }));

// ==================== ROUTES ====================

// List all events for this organizer
router.get('/:organizerId/events', eventsController.event_index_organizer);

// Show form to create a new event
router.get('/:organizerId/events/new', eventsController.event_new_form);

// Show details of a specific event
router.get('/:organizerId/events/:eventId', eventsController.event_details_organizer);

// Create a new event
router.post('/:organizerId/events', eventsController.event_create);

// Publish an event
router.patch('/:organizerId/events/:eventId/publish', eventsController.event_publish);

// Unpublish an event 
router.patch('/:organizerId/events/:eventId/unpublish', eventsController.event_unpublish);

// Delete an event permanently
router.delete('/:organizerId/events/:eventId', eventsController.event_delete);

module.exports = router;
