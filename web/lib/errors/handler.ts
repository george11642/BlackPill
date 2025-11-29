

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  name: string;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle errors in API routes
 * Returns appropriate error response
 */
export function handleApiError(error: unknown, request?: Request): Response {
  // Log to Sentry with context (if available)
  // Note: Sentry integration would be added separately
  if (typeof window === 'undefined' && global.Sentry) {
    // @ts-ignore - Sentry global may not be typed
    global.Sentry.captureException(error, {
      tags: {
        endpoint: request?.url || 'unknown',
        method: request?.method || 'unknown',
      },
    });
  }
  
  console.error('API Error:', {
    error: error instanceof Error ? error.message : String(error),
    endpoint: request?.url,
    method: request?.method,
  });

  // Handle file upload errors
  if (error instanceof Error) {
    if (error.message.includes('File too large') || error.message.includes('LIMIT_FILE_SIZE')) {
      return Response.json(
        {
          error: 'File too large',
          message: 'Image must be less than 2MB',
        },
        { status: 400 }
      );
    }

    if (error.message.includes('Invalid file') || error.message.includes('LIMIT_UNEXPECTED_FILE')) {
      return Response.json(
        {
          error: 'Invalid file',
          message: 'Only image files are allowed',
        },
        { status: 400 }
      );
    }
  }

  // Handle ApiError instances
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: error.name,
        message: error.message,
      },
      { status: error.statusCode }
    );
  }

  // Default error response
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : 'Internal server error';

  return Response.json(
    {
      error: error instanceof Error ? error.name : 'Error',
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error instanceof Error ? error.stack : undefined,
      }),
    },
    { status: statusCode }
  );
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request from args if available
      const request = args.find((arg) => arg instanceof Request) as Request | undefined;
      return handleApiError(error, request);
    }
  };
}

