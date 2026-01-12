/**
 * Response helper functions for route handlers
 * Provides convenient functions to create HTTP responses with status codes and headers
 */

import type { VitekResponse } from '../core/context/create-context.js';

/**
 * Creates a JSON response with status code and optional headers
 */
export function json(
  body: any,
  options: { status?: number; headers?: Record<string, string> } = {}
): VitekResponse {
  return {
    status: options.status || 200,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body,
  };
}

/**
 * Creates a 200 OK response
 */
export function ok(body: any, headers?: Record<string, string>): VitekResponse {
  return json(body, { status: 200, headers });
}

/**
 * Creates a 201 Created response
 */
export function created(body: any, headers?: Record<string, string>): VitekResponse {
  return json(body, { status: 201, headers });
}

/**
 * Creates a 204 No Content response
 */
export function noContent(headers?: Record<string, string>): VitekResponse {
  return {
    status: 204,
    headers: headers || {},
    body: undefined,
  };
}

/**
 * Creates a 400 Bad Request response
 */
export function badRequest(body: any = { error: 'Bad request' }, headers?: Record<string, string>): VitekResponse {
  return json(body, { status: 400, headers });
}

/**
 * Creates a 401 Unauthorized response
 */
export function unauthorized(body: any = { error: 'Unauthorized' }, headers?: Record<string, string>): VitekResponse {
  return json(body, { status: 401, headers });
}

/**
 * Creates a 403 Forbidden response
 */
export function forbidden(body: any = { error: 'Forbidden' }, headers?: Record<string, string>): VitekResponse {
  return json(body, { status: 403, headers });
}

/**
 * Creates a 404 Not Found response
 */
export function notFound(body: any = { error: 'Not found' }, headers?: Record<string, string>): VitekResponse {
  return json(body, { status: 404, headers });
}

/**
 * Creates a 409 Conflict response
 */
export function conflict(body: any = { error: 'Conflict' }, headers?: Record<string, string>): VitekResponse {
  return json(body, { status: 409, headers });
}

/**
 * Creates a 422 Unprocessable Entity response (validation errors)
 */
export function unprocessableEntity(
  body: any = { error: 'Validation error' },
  headers?: Record<string, string>
): VitekResponse {
  return json(body, { status: 422, headers });
}

/**
 * Creates a 429 Too Many Requests response
 */
export function tooManyRequests(
  body: any = { error: 'Too many requests' },
  headers?: Record<string, string>
): VitekResponse {
  return json(body, { status: 429, headers });
}

/**
 * Creates a 500 Internal Server Error response
 */
export function internalServerError(
  body: any = { error: 'Internal server error' },
  headers?: Record<string, string>
): VitekResponse {
  return json(body, { status: 500, headers });
}

/**
 * Creates a redirect response (301, 302, 307, 308)
 */
export function redirect(
  url: string,
  permanent: boolean = false,
  preserveMethod: boolean = false
): VitekResponse {
  const status = permanent ? (preserveMethod ? 308 : 301) : preserveMethod ? 307 : 302;
  return {
    status,
    headers: {
      Location: url,
    },
    body: undefined,
  };
}
