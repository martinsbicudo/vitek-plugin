import { describe, it, expect } from 'vitest';
import { parseRouteFile, createRoute } from './route-parser.js';
import type { ParsedRoute } from './route-parser.js';

describe('parseRouteFile', () => {
  const baseDir = '/project/src/api';

  it('should parse a simple GET route', () => {
    const result = parseRouteFile('/project/src/api/health.get.ts', baseDir);
    
    expect(result).toEqual({
      method: 'get',
      pattern: 'health',
      params: [],
      file: '/project/src/api/health.get.ts',
    });
  });

  it('should parse a route with dynamic parameter', () => {
    const result = parseRouteFile('/project/src/api/users/[id].get.ts', baseDir);
    
    expect(result).toEqual({
      method: 'get',
      pattern: 'users/:id',
      params: ['id'],
      file: '/project/src/api/users/[id].get.ts',
    });
  });

  it('should parse a route with multiple dynamic parameters', () => {
    const result = parseRouteFile('/project/src/api/users/[userId]/posts/[postId].get.ts', baseDir);
    
    expect(result).toEqual({
      method: 'get',
      pattern: 'users/:userId/posts/:postId',
      params: ['userId', 'postId'],
      file: '/project/src/api/users/[userId]/posts/[postId].get.ts',
    });
  });

  it('should parse a catch-all route', () => {
    const result = parseRouteFile('/project/src/api/posts/[...ids].get.ts', baseDir);
    
    expect(result).toEqual({
      method: 'get',
      pattern: 'posts/*ids',
      params: ['ids'],
      file: '/project/src/api/posts/[...ids].get.ts',
    });
  });

  it('should parse different HTTP methods', () => {
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
    
    methods.forEach((method) => {
      const result = parseRouteFile(`/project/src/api/users.${method}.ts`, baseDir);
      expect(result?.method).toBe(method);
    });
  });

  it('should handle index routes', () => {
    const result = parseRouteFile('/project/src/api/users/index.get.ts', baseDir);
    
    expect(result).toEqual({
      method: 'get',
      pattern: 'users',
      params: [],
      file: '/project/src/api/users/index.get.ts',
    });
  });

  it('should return null for non-route files', () => {
    const result = parseRouteFile('/project/src/api/utils.ts', baseDir);
    expect(result).toBeNull();
  });

  it('should return null for middleware files', () => {
    const result = parseRouteFile('/project/src/api/middleware.ts', baseDir);
    expect(result).toBeNull();
  });

  it('should return null for invalid HTTP methods', () => {
    const result = parseRouteFile('/project/src/api/users.invalid.ts', baseDir);
    expect(result).toBeNull();
  });

  it('should handle nested directories', () => {
    const result = parseRouteFile('/project/src/api/v1/users/[id]/profile.get.ts', baseDir);
    
    expect(result).toEqual({
      method: 'get',
      pattern: 'v1/users/:id/profile',
      params: ['id'],
      file: '/project/src/api/v1/users/[id]/profile.get.ts',
    });
  });

  it('should handle Windows-style paths', () => {
    const result = parseRouteFile('\\project\\src\\api\\users\\[id].get.ts', '\\project\\src\\api');
    
    expect(result).toEqual({
      method: 'get',
      pattern: 'users/:id',
      params: ['id'],
      file: '\\project\\src\\api\\users\\[id].get.ts',
    });
  });
});

describe('createRoute', () => {
  const mockHandler = async () => ({ success: true });

  it('should create a route from parsed data', () => {
    const parsed: ParsedRoute = {
      method: 'get',
      pattern: 'users/:id',
      params: ['id'],
      file: '/project/src/api/users/[id].get.ts',
    };

    const route = createRoute(parsed, mockHandler);

    expect(route).toMatchObject({
      pattern: 'users/:id',
      method: 'get',
      handler: mockHandler,
      params: ['id'],
      file: '/project/src/api/users/[id].get.ts',
      bodyType: undefined,
      queryType: undefined,
    });

    expect(route.regex).toBeInstanceOf(RegExp);
  });

  it('should include bodyType when provided', () => {
    const parsed: ParsedRoute = {
      method: 'post',
      pattern: 'users',
      params: [],
      file: '/project/src/api/users.post.ts',
    };

    const route = createRoute(parsed, mockHandler, '{ name: string; email: string; }');

    expect(route.bodyType).toBe('{ name: string; email: string; }');
  });

  it('should include queryType when provided', () => {
    const parsed: ParsedRoute = {
      method: 'get',
      pattern: 'users',
      params: [],
      file: '/project/src/api/users.get.ts',
    };

    const route = createRoute(parsed, mockHandler, undefined, '{ page?: number; limit?: number; }');

    expect(route.queryType).toBe('{ page?: number; limit?: number; }');
  });

  it('should create regex that matches the pattern', () => {
    const parsed: ParsedRoute = {
      method: 'get',
      pattern: 'users/:id',
      params: ['id'],
      file: '/project/src/api/users/[id].get.ts',
    };

    const route = createRoute(parsed, mockHandler);

    expect(route.regex.test('/users/123')).toBe(true);
    expect(route.regex.test('/users/abc')).toBe(true);
    expect(route.regex.test('/users')).toBe(false);
    expect(route.regex.test('/posts/123')).toBe(false);
  });
});
