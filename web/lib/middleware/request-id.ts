import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'next/server';

/**
 * Add unique request ID to request headers
 * This helps with error logging and debugging
 */
export function getRequestId(request: Request): string {
  return request.headers.get('x-request-id') || uuidv4();
}

/**
 * Add request ID to response headers
 */
export function setRequestIdHeaders(response: Response, requestId: string): void {
  response.headers.set('X-Request-ID', requestId);
}

/**
 * Create a response with request ID header
 */
export function createResponseWithId(
  body: unknown,
  init?: ResponseInit,
  requestId?: string
): Response {
  const response = Response.json(body, init);
  if (requestId) {
    setRequestIdHeaders(response, requestId);
  }
  return response;
}

