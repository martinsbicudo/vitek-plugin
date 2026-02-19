import { describe, it, expect } from 'vitest';
import {
  json,
  ok,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessableEntity,
  tooManyRequests,
  internalServerError,
  redirect,
} from './response-helpers.js';

describe('json', () => {
  it('should create JSON response with default status 200', () => {
    const response = json({ message: 'Hello' });
    expect(response).toEqual({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'Hello' },
    });
  });

  it('should create JSON response with custom status', () => {
    const response = json({ error: 'Not found' }, { status: 404 });
    expect(response.status).toBe(404);
  });

  it('should merge custom headers', () => {
    const response = json({}, { status: 200, headers: { 'X-Custom': 'value' } });
    expect(response.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Custom': 'value',
    });
  });
});

describe('ok', () => {
  it('should create 200 response', () => {
    const response = ok({ data: 'test' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: 'test' });
  });

  it('should handle null body', () => {
    const response = ok(null);
    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
  });
});

describe('created', () => {
  it('should create 201 response', () => {
    const response = created({ id: 1 });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 1 });
  });
});

describe('noContent', () => {
  it('should create 204 response', () => {
    const response = noContent();
    expect(response.status).toBe(204);
    expect(response.body).toBeUndefined();
  });

  it('should include custom headers', () => {
    const response = noContent({ 'X-Custom': 'value' });
    expect(response.headers).toEqual({ 'X-Custom': 'value' });
  });
});

describe('badRequest', () => {
  it('should create 400 response with default body', () => {
    const response = badRequest();
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Bad request' });
  });

  it('should accept custom body', () => {
    const response = badRequest({ error: 'Invalid input', details: { field: 'email' } });
    expect(response.body).toEqual({ error: 'Invalid input', details: { field: 'email' } });
  });

  it('should accept string body', () => {
    const response = badRequest('Validation failed');
    expect(response.body).toBe('Validation failed');
  });
});

describe('unauthorized', () => {
  it('should create 401 response with default body', () => {
    const response = unauthorized();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('should accept custom body', () => {
    const response = unauthorized({ error: 'Invalid token' });
    expect(response.body).toEqual({ error: 'Invalid token' });
  });
});

describe('forbidden', () => {
  it('should create 403 response with default body', () => {
    const response = forbidden();
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
  });
});

describe('notFound', () => {
  it('should create 404 response with default body', () => {
    const response = notFound();
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });

  it('should accept custom body', () => {
    const response = notFound({ error: 'User not found', id: '123' });
    expect(response.body).toEqual({ error: 'User not found', id: '123' });
  });
});

describe('conflict', () => {
  it('should create 409 response with default body', () => {
    const response = conflict();
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Conflict' });
  });

  it('should accept custom body', () => {
    const response = conflict({ error: 'Resource already exists' });
    expect(response.body).toEqual({ error: 'Resource already exists' });
  });
});

describe('unprocessableEntity', () => {
  it('should create 422 response with default body', () => {
    const response = unprocessableEntity();
    expect(response.status).toBe(422);
    expect(response.body).toEqual({ error: 'Validation error' });
  });

  it('should accept custom body with errors', () => {
    const response = unprocessableEntity({ 
      error: 'Validation failed', 
      errors: [{ field: 'email', message: 'Invalid format' }] 
    });
    expect(response.body).toEqual({
      error: 'Validation failed',
      errors: [{ field: 'email', message: 'Invalid format' }],
    });
  });
});

describe('tooManyRequests', () => {
  it('should create 429 response with default body', () => {
    const response = tooManyRequests();
    expect(response.status).toBe(429);
    expect(response.body).toEqual({ error: 'Too many requests' });
  });

  it('should accept custom body with retry info', () => {
    const response = tooManyRequests({ error: 'Too many requests', retryAfter: 60 });
    expect(response.body).toEqual({ error: 'Too many requests', retryAfter: 60 });
  });
});

describe('internalServerError', () => {
  it('should create 500 response with default body', () => {
    const response = internalServerError();
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  it('should accept custom body', () => {
    const response = internalServerError({ error: 'Database connection failed' });
    expect(response.body).toEqual({ error: 'Database connection failed' });
  });
});

describe('redirect', () => {
  it('should create 302 redirect by default', () => {
    const response = redirect('/new-path');
    expect(response.status).toBe(302);
    expect(response.headers?.Location).toBe('/new-path');
    expect(response.body).toBeUndefined();
  });

  it('should create 301 redirect when permanent', () => {
    const response = redirect('/new-path', true);
    expect(response.status).toBe(301);
  });

  it('should create 307 redirect for temporary with method preservation', () => {
    const response = redirect('/new-path', false, true);
    expect(response.status).toBe(307);
  });

  it('should create 308 redirect for permanent with method preservation', () => {
    const response = redirect('/new-path', true, true);
    expect(response.status).toBe(308);
  });
});
