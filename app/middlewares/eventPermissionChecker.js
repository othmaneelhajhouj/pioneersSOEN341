/**
 * AUTHORIZATION MIDDLEWARE
 * Checks if a user has permission to access organizer-specific routes
 * Currently validates organizerId from route params, but designed to be extended
 * with proper authentication (JWT, sessions, etc.) in the future
 */

const { MESSAGES } = require('../utils/constants');
const { wantsJson } = require('../utils/validation');

/**
 * Creates a middleware function that checks organizer permissions
 * @param {Object} options - Configuration options
 * @param {string} options.from - Where to get organizerId from ('params' or 'user')
 * @returns {Function} Express middleware function
 */
function checkOrganizerPermissions(options = {}) {
  const from = options.from || "params";

  return function (req, res, next) {
    let organizerId;

    // Check where to get organizerId from
    if (from === "user") {
      // Future: get from authenticated user session/token
      organizerId = req.user ? req.user.id : null;
    } else {
      // Current: get from route parameters (e.g., /organizers/:organizerId/...)
      organizerId = req.params.organizerId;
    }

    // Deny access if no organizerId found
    if (!organizerId) {
      if (wantsJson(req)) return res.status(403).json({ error: MESSAGES.UNAUTHORIZED });
      return res.status(403).send(MESSAGES.UNAUTHORIZED);
    }

    if (!req.user) {
      if (wantsJson(req)) return res.status(401).json({ error: "Authentication required." });
      return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl || "/")}`);
    }

    if (req.user.role === "admin") {
      req.organizerId = organizerId;
      return next();
    }

    if (req.user.role !== "organizer") {
      if (wantsJson(req)) return res.status(403).json({ error: "Organizer access required." });
      return res.status(403).send("Organizer access required.");
    }

    if (req.user.organizerStatus !== "approved") {
      if (wantsJson(req)) return res.status(403).json({ error: "Organizer approval required." });
      return res.status(403).send("Organizer approval required.");
    }

    if (req.user.id !== organizerId) {
      if (wantsJson(req)) return res.status(403).json({ error: "You cannot manage another organizer's events." });
      return res.status(403).send("You cannot manage another organizer's events.");
    }

    // Attach organizerId to request for use in route handlers
    req.organizerId = organizerId;
    
    // Continue to next middleware/route handler
    next();
  };
}

module.exports = checkOrganizerPermissions; 