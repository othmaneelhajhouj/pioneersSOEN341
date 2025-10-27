# Quick Reference

## File Structure
```
Sprint2/app/
├── app.js                          # Main application entry point
├── controllers/
│   └── eventsController.js         # Business logic for events
├── routes/
│   ├── events.public.js            # Public routes (students)
│   └── events.organizer.js         # Organizer routes
├── middlewares/
│   └── eventPermissionChecker.js   # Authorization middleware
├── utils/                          # NEW! Utility functions
│   ├── constants.js                # Application constants
│   ├── validation.js               # Validation functions
│   ├── logger.js                   # Logging utilities
│   └── README.md                   # Utils documentation
├── views/
│   └── organizer/
│       ├── index.ejs               # Events dashboard
│       ├── show.ejs                # Event details
│       └── new.ejs                 # Create event form
└── public/
    ├── css/
    │   ├── organizer.css           # Dashboard styles
    │   ├── event-details.css       # Event details styles
    │   └── form.css                # Form styles
    └── js/
        ├── organizer-dashboard.js  # Dashboard interactions
        ├── event-details.js        # Event details interactions
        └── create-event.js         # Create form interactions
```

## Common Tasks

### 1. Adding a New Error Message
**File:** `utils/constants.js`
```javascript
const MESSAGES = {
  // ... existing messages
  YOUR_NEW_MESSAGE: 'Your error text here',
};
```

### 2. Adding a New Validation Rule
**File:** `utils/validation.js`
```javascript
function validateEventData(data) {
  const errors = [];
  
  // Add your validation here
  if (!data.yourField) {
    errors.push("Your field is required");
  }
  
  // ... rest of validation
}
```

### 3. Adding a New Route
**File:** `routes/events.organizer.js`
```javascript
// GET route example
router.get('/:organizerId/events/:eventId/your-route', 
  eventsController.your_controller_function
);

// POST route example
router.post('/:organizerId/events/:eventId/your-route', 
  eventsController.your_controller_function
);
```

**File:** `controllers/eventsController.js`
```javascript
/**
 * Description of what this does
 */
const your_controller_function = async (req, res) => {
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    console.error('Error description:', error);
    res.status(500).json({ error: MESSAGES.SERVER_ERROR });
  }
};

// Don't forget to export it
module.exports = {
  // ... existing exports
  your_controller_function,
};
```

### 4. Changing the Port
**Option 1:** Environment variable (recommended)
```bash
# In terminal
$env:PORT=8080; npm run devstart
```

**Option 2:** Edit constants file
```javascript
// utils/constants.js
const SERVER_PORT = process.env.PORT || 8080; // Change 3000 to 8080
```

### 5. Adding Console Logs for Debugging
```javascript
const logger = require('./utils/logger');

// Info message
logger.info('Event created', { eventId: event.id });

// Error message
logger.error('Failed to create event', error);

// Debug message (only shows in development)
logger.debug('Request body', { body: req.body });
```

## Useful Commands

```bash
# Start development server with auto-reload
npm run devstart

# Run database migrations
npm run prisma migrate dev

# Open Prisma Studio (database GUI)
npm run prisma studio

# Seed database with test data
npm run seed
```

## Common Patterns

### Pattern 1: JSON vs HTML Response
```javascript
const { wantsJson } = require('../utils/validation');

const isJsonRequest = wantsJson(req);

if (isJsonRequest) {
  return res.json({ data: result });
}
return res.render('template', { data: result });
```

### Pattern 2: Error Handling
```javascript
const { MESSAGES } = require('../utils/constants');

try {
  // Your code
  res.json({ success: true });
} catch (error) {
  console.error('Descriptive error message:', error);
  res.status(500).json({ error: MESSAGES.SERVER_ERROR });
}
```

### Pattern 3: Authorization Check
```javascript
// Already applied as middleware, just use:
const organizerId = req.organizerId;

// Verify ownership before action
const event = await prisma.event.findFirst({
  where: { id: eventId, organizerId } // Must belong to this organizer
});
```

### Pattern 4: Database Query with Prisma
```javascript
// Find many
const events = await prisma.event.findMany({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  include: { organizer: true }
});

// Find one
const event = await prisma.event.findUnique({
  where: { id: eventId }
});

// Create
const event = await prisma.event.create({
  data: { title: 'Event', /* ... */ }
});

// Update
const event = await prisma.event.update({
  where: { id: eventId },
  data: { published: true }
});

// Delete
await prisma.event.delete({
  where: { id: eventId }
});
```

## HTTP Status Codes Used

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (new resource) |
| 400 | Bad Request | Validation failed |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation errors |
| 500 | Internal Server Error | Unexpected error |

## Testing the Application

### 1. Start the Server
```bash
npm run devstart
```

### 2. Open in Browser
```
http://localhost:3000/organizers/YOUR_ORGANIZER_ID/events
```

### 3. Test with Curl (API)
```bash
# Get events list
curl http://localhost:3000/organizers/ID/events

# Create event (JSON)
curl -X POST http://localhost:3000/organizers/ID/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Event","description":"Test","location":"Montreal",...}'
```
