const express = require('express');
const eventsController = require('../controllers/eventsController');
const router = express.Router();

router.get('/', eventsController.event_index);
router.post('/',eventsController.event_create);
router.patch('/:id/publish', eventsController.event_publish);
module.exports = router;