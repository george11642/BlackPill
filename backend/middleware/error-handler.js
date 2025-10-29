/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log to Sentry with context
  if (global.Sentry) {
    global.Sentry.captureException(err, {
      user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
      tags: {
        endpoint: req.path,
        method: req.method,
      },
      extra: {
        request_id: req.requestId,
        user_agent: req.headers['user-agent'],
        ip: req.ip,
      },
    });
  }
  
  console.error('Error:', {
    error: err.message,
    request_id: req.requestId,
    endpoint: req.path,
    user_id: req.user?.id,
  });

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'Image must be less than 2MB',
      request_id: req.requestId,
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Invalid file',
      message: 'Only image files are allowed',
      request_id: req.requestId,
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: err.name || 'Error',
    message,
    request_id: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;

