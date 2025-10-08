const express = require('express');
const eventsController = require('../controllers/eventsController');
const router = express.Router();

router.get('/', eventsController.event_index_student);
router.get('/:id', eventsController.event_details)

module.exports = router;