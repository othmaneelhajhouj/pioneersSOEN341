/**
 * VALIDATION UTILITIES
 * Reusable validation functions
 */

/**
 * Validates event creation/update data
 * @param {Object} data - Event data from request body
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
function validateEventData(data) {
  const errors = [];
  const { title, description, startsAt, endsAt, location, type, capacity, price } = data;

  // Required field validation
  if (!title?.trim()) errors.push("Title is required");
  if (!description?.trim()) errors.push("Description is required");
  if (!location?.trim()) errors.push("Location is required");
  if (!type) errors.push("Ticket type is required");
  if (!capacity) errors.push("Capacity is required");
  if (!startsAt) errors.push("Start time is required");
  if (!endsAt) errors.push("End time is required");

  // Date validation
  const starts = startsAt ? new Date(startsAt) : null;
  const ends = endsAt ? new Date(endsAt) : null;

  if (starts && isNaN(starts.getTime())) {
    errors.push("Invalid start date format");
  }
  if (ends && isNaN(ends.getTime())) {
    errors.push("Invalid end date format");
  }
  if (starts && ends && starts >= ends) {
    errors.push("End time must be after start time");
  }

  // Capacity validation
  const cap = parseInt(capacity, 10);
  if (!Number.isInteger(cap) || cap <= 0) {
    errors.push("Capacity must be a positive number");
  }

  // Price validation for paid events
  let priceInCents = null;
  if (type === "paid") {
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.push("Price must be a non-negative number");
    } else {
      priceInCents = Math.round(priceNum * 100); // Convert to cents
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedData: {
      title: title?.trim(),
      description: description?.trim(),
      location: location?.trim(),
      startsAt: starts,
      endsAt: ends,
      type: type === "paid" ? "paid" : "free",
      capacity: cap,
      price: priceInCents,
    }
  };
}

/**
 * Checks if request expects JSON response
 * @param {Object} req - 
 * @returns {boolean}
 */
function wantsJson(req) {
  const contentType = req.headers['content-type'] || '';
  const accept = req.headers.accept || '';
  return contentType.includes('application/json') || accept.includes('application/json');
}

module.exports = {
  validateEventData,
  wantsJson,
};
