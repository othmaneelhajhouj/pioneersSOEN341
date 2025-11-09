/**
 * APPLICATION CONSTANTS
 * Centralized location for configuration values and magic strings
 * This makes the code more maintainable and easier to update
 */

// Server configuration
const SERVER_PORT = process.env.PORT || 3000;

// Response messages
const MESSAGES = {
  // Success messages
  EVENT_CREATED: 'Event created successfully',
  EVENT_UPDATED: 'Event updated successfully',
  EVENT_DELETED: 'Event deleted successfully',
  EVENT_PUBLISHED: 'Event published successfully',
  EVENT_UNPUBLISHED: 'Event unpublished successfully',
  
  // Error messages
  EVENT_NOT_FOUND: 'Event not found',
  UNAUTHORIZED: 'You do not have permission to perform this action',
  INVALID_ORGANIZER: 'Invalid organizer',
  VALIDATION_FAILED: 'Validation failed',
  SERVER_ERROR: 'An unexpected error occurred',
  EVENT_CREATE_FAILED: 'Failed to create event',
  EVENT_DELETE_FAILED: 'Failed to delete event',
  EVENT_UPDATE_FAILED: 'Failed to update event',
};

// Default values
const DEFAULTS = {
  EVENT_CAPACITY: 50,
  EVENT_TYPE: 'free',
};

module.exports = {
  SERVER_PORT,
  MESSAGES,
  DEFAULTS,
};
