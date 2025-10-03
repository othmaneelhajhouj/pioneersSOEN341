const express = require('express');
const eventsController = require('../controllers/eventsController');
const router = express.Router();

router.get('/:OrganizerId/events', eventsController.event_index_organizer);
router.post('/:OrganizerId/events',eventsController.event_create);
router.patch('/events/:eventId/publish', eventsController.event_publish);
router.patch('/events/:eventId/unpublish', eventsController.event_unpublish);
router.delete('/events/:eventId',eventsController.event_delete)