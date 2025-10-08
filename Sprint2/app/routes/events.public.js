const express = require('express');
const eventsController = require('../controllers/eventsController');

const router = express.Router();

// ==================== PUBLIC EVENT ROUTES ====================
// These routes are accessible to all students/users

// GET /events
// Display list of all published events available to students

router.get('/', async (req, res) => {

    // Get list of events from controller
    const events = await eventsController.event_index_student();
        
    // Render the student index page 
    res.render('student/index', { events });
});

// GET /events/:id
// Display details of a specific event for students
router.get('/:id', eventsController.event_details_student);

module.exports = router;
