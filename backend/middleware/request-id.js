const { v4: uuidv4 } = require('uuid');

/**
 * Add unique request ID to every request for tracing
 * This helps with error logging in Sentry and debugging
 */
function addRequestId(req, res, next) {
  // Generate unique request ID
  req.requestId = req.headers['x-request-id'] || uuidv4();
  
  // Add to response headers
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
}

module.exports = addRequestId;

