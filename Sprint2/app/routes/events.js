const express = require('express');
const eventsController = require('../controllers/eventsController');
const router = express.Router();

router.get('/', eventsController.event_index);


module.exports = router;