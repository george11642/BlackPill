/**
 * Response utilities for Edge Functions
 */

import { corsHeaders } from "./cors.ts";

/**
 * Generate or extract request ID
 */
export function getRequestId(req: Request): string {
  return req.headers.get("x-request-id") || crypto.randomUUID();
}

/**
 * Create a JSON response with request ID header
 */
export function createResponseWithId(
  data: unknown,
  status = 200,
  requestId?: string
): Response {
  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };

  if (requestId) {
    headers["X-Request-ID"] = requestId;
  }

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

/**
 * Create an error response with proper formatting
 */
export function createErrorResponse(
  message: string,
  status = 500,
  requestId?: string,
  additionalData?: Record<string, unknown>
): Response {
  const errorType =
    status === 400
      ? "Bad Request"
      : status === 401
        ? "Unauthorized"
        : status === 402
          ? "Payment Required"
          : status === 403
            ? "Forbidden"
            : status === 404
              ? "Not Found"
              : status === 429
                ? "Rate limit exceeded"
                : "Error";

  return createResponseWithId(
    {
      error: errorType,
      message,
      ...additionalData,
    },
    status,
    requestId
  );
}

/**
 * Handle API errors consistently
 */
export function handleApiError(
  error: unknown,
  requestId?: string
): Response {
  const message = error instanceof Error ? error.message : "Internal server error";

  console.error("[API Error]", {
    error: message,
    requestId,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Check for specific error types
  if (message.includes("Insufficient scans")) {
    return createErrorResponse(
      "Insufficient scans remaining. Please upgrade your subscription.",
      402,
      requestId
    );
  }

  if (message.includes("Rate limit")) {
    return createErrorResponse(message, 429, requestId);
  }

  if (
    message.includes("Missing") ||
    message.includes("Invalid") ||
    message.includes("expired")
  ) {
    return createErrorResponse(message, 401, requestId);
  }

  if (message.includes("not found")) {
    return createErrorResponse(message, 404, requestId);
  }

  return createErrorResponse(message, 500, requestId);
}
