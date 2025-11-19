/**
 * AUTHORIZATION MIDDLEWARE
 * Checks if a user has permission to access organizer-specific routes
 * Validates that the authenticated user is an approved organizer and matches the organizerId in the route
 */

const { MESSAGES } = require('../utils/constants');
const { wantsJson } = require('../utils/validation');

/**
 * Creates a middleware function that checks organizer permissions
 * @param {Object} options - Configuration options
 * @param {string} options.from - Where to get organizerId from ('params' or 'user')
 * @param {boolean} options.allowAdmin - Whether to allow admin users (default: true)
 * @returns {Function} Express middleware function
 */
function checkOrganizerPermissions(options = {}) {
  const from = options.from || "params";
  const allowAdmin = options.allowAdmin !== false;

  return function (req, res, next) {
    // Check if user is authenticated (set by auth middleware in app.js)
    if (!req.user) {
      if (wantsJson(req)) {
        return res.status(401).json({ error: "Authentication required." });
      }
      return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl || "/")}`);
    }

    let organizerId;

    // Determine organizerId based on configuration
    if (from === "user") {
      // Get organizerId from the authenticated user
      organizerId = req.user.id;
    } else {
      // Get organizerId from route parameters (e.g., /organizers/:organizerId/...)
      organizerId = req.params.organizerId;
    }

    // Deny access if no organizerId found
    if (!organizerId) {
      if (wantsJson(req)) {
        return res.status(403).json({ error: MESSAGES.UNAUTHORIZED });
      }
      return res.status(403).send(MESSAGES.UNAUTHORIZED);
    }

    // Allow admins to access any organizer's resources (if enabled)
    if (allowAdmin && req.user.role === "admin") {
      req.organizerId = organizerId;
      return next();
    }

    // Check if user has organizer role
    if (req.user.role !== "organizer") {
      if (wantsJson(req)) {
        return res.status(403).json({ error: "Organizer access required." });
      }
      return res.status(403).send("Organizer access required.");
    }

    // Check if organizer is approved
    if (req.user.organizerStatus !== "approved") {
      if (wantsJson(req)) {
        return res.status(403).json({ error: "Organizer approval required." });
      }
      return res.status(403).send("Organizer approval required.");
    }

    // Verify the user owns the organizerId they're trying to access
    if (req.user.id !== organizerId) {
      if (wantsJson(req)) {
        return res.status(403).json({ error: "You cannot manage another organizer's events." });
      }
      return res.status(403).send("You cannot manage another organizer's events.");
    }

    // Attach organizerId to request for use in route handlers
    req.organizerId = organizerId;
    
    // Continue to next middleware/route handler
    next();
  };
}

module.exports = checkOrganizerPermissions; 