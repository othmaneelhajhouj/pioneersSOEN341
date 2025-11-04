/**
 * LOGGING UTILITIES
 * Provides consistent logging across the application
 * Makes it easier to debug and track application behavior
 */

/**
 * Log levels for different types of messages
 */
const LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
};

/**
 * Gets current timestamp in readable format
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Generic log function
 * @param {string} level - Log level (INFO, WARN, ERROR, DEBUG)
 * @param {string} message - Message to log
 * @param {Object} meta - Additional metadata to log
 */
function log(level, message, meta = {}) {
  const timestamp = getTimestamp();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  };

  // In production, you might want to send these to a logging service
  // For development, console is fine
  const output = `[${timestamp}] ${level}: ${message}`;
  
  switch (level) {
    case LogLevel.ERROR:
      console.error(output, meta);
      break;
    case LogLevel.WARN:
      console.warn(output, meta);
      break;
    case LogLevel.DEBUG:
      if (process.env.NODE_ENV === 'development') {
        console.debug(output, meta);
      }
      break;
    default:
      console.log(output, meta);
  }
}

/**
 * Log an informational message
 * @param {string} message - Message to log
 * @param {Object} meta - Additional metadata
 */
function info(message, meta = {}) {
  log(LogLevel.INFO, message, meta);
}

/**
 * Log a warning message
 * @param {string} message - Message to log
 * @param {Object} meta - Additional metadata
 */
function warn(message, meta = {}) {
  log(LogLevel.WARN, message, meta);
}

/**
 * Log an error message
 * @param {string} message - Message to log
 * @param {Error} error - Error object
 * @param {Object} meta - Additional metadata
 */
function error(message, error = null, meta = {}) {
  const errorMeta = {
    ...meta,
    errorMessage: error?.message,
    errorStack: error?.stack,
  };
  log(LogLevel.ERROR, message, errorMeta);
}

/**
 * Log a debug message 
 * @param {string} message - Message to log
 * @param {Object} meta - Additional metadata
 */
function debug(message, meta = {}) {
  log(LogLevel.DEBUG, message, meta);
}

/**
 * Log HTTP request details
 * Useful for tracking API calls
 * @param {Object} req - Express request object
 */
function logRequest(req) {
  info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
}

module.exports = {
  LogLevel,
  info,
  warn,
  error,
  debug,
  logRequest,
};
