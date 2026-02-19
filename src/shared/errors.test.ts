import { describe, it, expect } from 'vitest';
import {
  VitekError,
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,
} from './errors.js';

describe('VitekError', () => {
  it('should create error with message', () => {
    const error = new VitekError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.name).toBe('VitekError');
  });

  it('should capture stack trace', () => {
    const error = new VitekError('Test error');
    expect(error.stack).toBeDefined();
  });
});

describe('HttpError', () => {
  it('should create error with message and status code', () => {
    const error = new HttpError("I'm a teapot", 418);
    expect(error.message).toBe("I'm a teapot");
    expect(error.statusCode).toBe(418);
    expect(error.name).toBe('HttpError');
  });

  it('should accept custom code', () => {
    const error = new HttpError('Bad request', 400, 'CUSTOM_CODE');
    expect(error.code).toBe('CUSTOM_CODE');
  });

  it('should have undefined code when not provided', () => {
    const error = new HttpError('Server error', 500);
    expect(error.code).toBeUndefined();
  });
});

describe('BadRequestError', () => {
  it('should have correct status code', () => {
    const error = new BadRequestError('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('BadRequestError');
    expect(error.code).toBe('BAD_REQUEST');
  });

  it('should accept custom message', () => {
    const error = new BadRequestError('Missing required field');
    expect(error.message).toBe('Missing required field');
  });

  it('should have default message', () => {
    const error = new BadRequestError();
    expect(error.message).toBe('Bad request');
  });
});

describe('UnauthorizedError', () => {
  it('should have correct status code', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe('UnauthorizedError');
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('should have default message', () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe('Unauthorized');
  });

  it('should accept custom message', () => {
    const error = new UnauthorizedError('Invalid credentials');
    expect(error.message).toBe('Invalid credentials');
  });
});

describe('ForbiddenError', () => {
  it('should have correct status code', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.name).toBe('ForbiddenError');
    expect(error.code).toBe('FORBIDDEN');
  });

  it('should have default message', () => {
    const error = new ForbiddenError();
    expect(error.message).toBe('Forbidden');
  });
});

describe('NotFoundError', () => {
  it('should have correct status code', () => {
    const error = new NotFoundError('Resource not found');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('NotFoundError');
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should have default message', () => {
    const error = new NotFoundError();
    expect(error.message).toBe('Not found');
  });

  it('should accept custom message', () => {
    const error = new NotFoundError('User not found');
    expect(error.message).toBe('User not found');
  });

  it('should store route information', () => {
    const error = new NotFoundError('Not found', '/users/123');
    expect(error.route).toBe('/users/123');
  });
});

describe('ConflictError', () => {
  it('should have correct status code', () => {
    const error = new ConflictError('Resource already exists');
    expect(error.statusCode).toBe(409);
    expect(error.name).toBe('ConflictError');
    expect(error.code).toBe('CONFLICT');
  });

  it('should have default message', () => {
    const error = new ConflictError();
    expect(error.message).toBe('Conflict');
  });
});

describe('ValidationError', () => {
  it('should have correct status code', () => {
    const error = new ValidationError('Invalid email format');
    expect(error.statusCode).toBe(422);
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should have default message', () => {
    const error = new ValidationError();
    expect(error.message).toBe('Validation error');
  });

  it('should accept validation errors', () => {
    const errors = { email: ['invalid format'] };
    const error = new ValidationError('Validation failed', errors);
    expect(error.errors).toEqual(errors);
  });
});

describe('TooManyRequestsError', () => {
  it('should have correct status code', () => {
    const error = new TooManyRequestsError();
    expect(error.statusCode).toBe(429);
    expect(error.name).toBe('TooManyRequestsError');
    expect(error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('should have default message', () => {
    const error = new TooManyRequestsError();
    expect(error.message).toBe('Too many requests');
  });

  it('should accept custom message', () => {
    const error = new TooManyRequestsError('Rate limit exceeded');
    expect(error.message).toBe('Rate limit exceeded');
  });
});

describe('InternalServerError', () => {
  it('should have correct status code', () => {
    const error = new InternalServerError();
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('InternalServerError');
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('should have default message', () => {
    const error = new InternalServerError();
    expect(error.message).toBe('Internal server error');
  });

  it('should accept custom message', () => {
    const error = new InternalServerError('Database connection failed');
    expect(error.message).toBe('Database connection failed');
  });
});

describe('Error inheritance', () => {
  it('all HTTP errors should be instances of HttpError', () => {
    expect(new BadRequestError('test')).toBeInstanceOf(HttpError);
    expect(new UnauthorizedError()).toBeInstanceOf(HttpError);
    expect(new ForbiddenError()).toBeInstanceOf(HttpError);
    expect(new NotFoundError('test')).toBeInstanceOf(HttpError);
    expect(new ConflictError('test')).toBeInstanceOf(HttpError);
    expect(new ValidationError('test')).toBeInstanceOf(HttpError);
    expect(new TooManyRequestsError()).toBeInstanceOf(HttpError);
    expect(new InternalServerError()).toBeInstanceOf(HttpError);
  });

  it('all errors should be instances of Error', () => {
    expect(new VitekError('test')).toBeInstanceOf(Error);
    expect(new HttpError('test', 500)).toBeInstanceOf(Error);
  });

  it('all HTTP errors should be instances of VitekError', () => {
    expect(new BadRequestError('test')).toBeInstanceOf(VitekError);
    expect(new HttpError('test', 500)).toBeInstanceOf(VitekError);
  });
});
