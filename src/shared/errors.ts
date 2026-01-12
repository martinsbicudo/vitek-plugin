/**
 * Custom Vitek errors
 */

export class VitekError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'VitekError';
  }
}

export class RouteError extends VitekError {
  constructor(message: string, public route?: string) {
    super(message, 'ROUTE_ERROR');
    this.name = 'RouteError';
  }
}

export class MiddlewareError extends VitekError {
  constructor(message: string) {
    super(message, 'MIDDLEWARE_ERROR');
    this.name = 'MiddlewareError';
  }
}

export class TypeGenerationError extends VitekError {
  constructor(message: string) {
    super(message, 'TYPE_GENERATION_ERROR');
    this.name = 'TypeGenerationError';
  }
}

/**
 * Base HTTP error class with status code
 */
export class HttpError extends VitekError {
  constructor(
    message: string,
    public statusCode: number = 500,
    code?: string
  ) {
    super(message, code);
    this.name = 'HttpError';
  }
}

/**
 * 400 Bad Request error
 */
export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
    this.name = 'BadRequestError';
  }
}

/**
 * 401 Unauthorized error
 */
export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * 403 Forbidden error
 */
export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * 404 Not Found error
 */
export class NotFoundError extends HttpError {
  constructor(message: string = 'Not found', public route?: string) {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * 409 Conflict error
 */
export class ConflictError extends HttpError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * 422 Unprocessable Entity error (validation errors)
 */
export class ValidationError extends HttpError {
  constructor(
    message: string = 'Validation error',
    public errors?: Record<string, string[]>
  ) {
    super(message, 422, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * 429 Too Many Requests error
 */
export class TooManyRequestsError extends HttpError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'TOO_MANY_REQUESTS');
    this.name = 'TooManyRequestsError';
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
    this.name = 'InternalServerError';
  }
}
