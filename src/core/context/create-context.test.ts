import { describe, it, expect } from 'vitest';
import { isVitekResponse, createContext } from './create-context.js';

describe('isVitekResponse', () => {
  it('returns true for object with status number', () => {
    expect(isVitekResponse({ status: 201 })).toBe(true);
    expect(isVitekResponse({ status: 404, body: null })).toBe(true);
  });

  it('returns true for object with headers object', () => {
    expect(isVitekResponse({ headers: {} })).toBe(true);
    expect(isVitekResponse({ headers: { 'Content-Type': 'text/plain' } })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isVitekResponse(null)).toBe(false);
  });

  it('returns false for array', () => {
    expect(isVitekResponse([])).toBe(false);
    expect(isVitekResponse([{ status: 200 }])).toBe(false);
  });

  it('returns false for plain object without status or headers', () => {
    expect(isVitekResponse({})).toBe(false);
    expect(isVitekResponse({ body: { id: 1 } })).toBe(false);
  });

  it('returns false when status is not a number', () => {
    expect(isVitekResponse({ status: '200' })).toBe(false);
  });

  it('returns false when headers is not a plain object', () => {
    expect(isVitekResponse({ headers: null })).toBe(false);
    expect(isVitekResponse({ headers: [] })).toBe(false);
  });
});

describe('createContext', () => {
  it('builds context with path from url and lowercased method', () => {
    const request = {
      url: 'http://localhost/api/users/1',
      method: 'GET',
      headers: {},
    };
    const ctx = createContext(request, { id: '1' }, { page: '2' });
    expect(ctx.url).toBe('http://localhost/api/users/1');
    expect(ctx.path).toBe('/api/users/1');
    expect(ctx.method).toBe('get');
    expect(ctx.params).toEqual({ id: '1' });
    expect(ctx.query).toEqual({ page: '2' });
    expect(ctx.headers).toEqual({});
  });

  it('uses pathname from URL', () => {
    const request = {
      url: '/api/health?foo=bar',
      method: 'get',
      headers: {},
    };
    const ctx = createContext(request);
    expect(ctx.path).toBe('/api/health');
    expect(ctx.query).toEqual({});
  });

  it('defaults params and query to empty objects', () => {
    const request = { url: '/api', method: 'get', headers: {} };
    const ctx = createContext(request);
    expect(ctx.params).toEqual({});
    expect(ctx.query).toEqual({});
  });

  it('passes through body when provided', () => {
    const request = {
      url: '/api',
      method: 'post',
      headers: {},
      body: { name: 'test' },
    };
    const ctx = createContext(request);
    expect(ctx.body).toEqual({ name: 'test' });
  });
});
