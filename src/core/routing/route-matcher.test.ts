import { describe, it, expect } from 'vitest';
import { matchRoute } from './route-matcher.js';
import type { Route } from './route-types.js';
import { createRoute } from './route-parser.js';
import type { ParsedRoute } from './route-parser.js';

function createTestRoute(parsed: ParsedRoute): Route {
  return createRoute(parsed, async () => ({ success: true }));
}

describe('matchRoute', () => {
  describe('basic matching', () => {
    it('should match exact path', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: 'health',
          params: [],
          file: '/api/health.get.ts',
        }),
      ];

      const match = matchRoute(routes, '/health', 'get');

      expect(match).not.toBeNull();
      expect(match?.route.pattern).toBe('health');
      expect(match?.params).toEqual({});
    });

    it('should match path with leading slash', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: 'health',
          params: [],
          file: '/api/health.get.ts',
        }),
      ];

      const match = matchRoute(routes, 'health', 'get');

      expect(match).not.toBeNull();
      expect(match?.route.pattern).toBe('health');
    });

    it('should return null for non-matching path', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: 'health',
          params: [],
          file: '/api/health.get.ts',
        }),
      ];

      const match = matchRoute(routes, '/users', 'get');

      expect(match).toBeNull();
    });

    it('should return null for non-matching method', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: 'health',
          params: [],
          file: '/api/health.get.ts',
        }),
      ];

      const match = matchRoute(routes, '/health', 'post');

      expect(match).toBeNull();
    });
  });

  describe('dynamic parameters', () => {
    it('should extract single parameter', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: 'users/:id',
          params: ['id'],
          file: '/api/users/[id].get.ts',
        }),
      ];

      const match = matchRoute(routes, '/users/123', 'get');

      expect(match).not.toBeNull();
      expect(match?.params).toEqual({ id: '123' });
    });

    it('should extract multiple parameters', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: 'users/:userId/posts/:postId',
          params: ['userId', 'postId'],
          file: '/api/users/[userId]/posts/[postId].get.ts',
        }),
      ];

      const match = matchRoute(routes, '/users/42/posts/99', 'get');

      expect(match).not.toBeNull();
      expect(match?.params).toEqual({ userId: '42', postId: '99' });
    });

    it('should handle parameters with special characters', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: 'files/:filename',
          params: ['filename'],
          file: '/api/files/[filename].get.ts',
        }),
      ];

      const match = matchRoute(routes, '/files/document.pdf', 'get');

      expect(match).not.toBeNull();
      expect(match?.params).toEqual({ filename: 'document.pdf' });
    });
  });

  describe('catch-all parameters', () => {
    it('should match catch-all route', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: 'files/*path',
          params: ['path'],
          file: '/api/files/[...path].get.ts',
        }),
      ];

      const match = matchRoute(routes, '/files/docs/folder/file.txt', 'get');

      expect(match).not.toBeNull();
      expect(match?.params).toEqual({ path: 'docs/folder/file.txt' });
    });

    it('should match catch-all with single segment', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: 'api/*rest',
          params: ['rest'],
          file: '/api/api/[...rest].get.ts',
        }),
      ];

      const match = matchRoute(routes, '/api/users', 'get');

      expect(match).not.toBeNull();
      expect(match?.params).toEqual({ rest: 'users' });
    });
  });

  describe('method case insensitivity', () => {
    it('should match uppercase methods', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: 'health',
          params: [],
          file: '/api/health.get.ts',
        }),
      ];

      const match = matchRoute(routes, '/health', 'GET');

      expect(match).not.toBeNull();
    });

    it('should match mixed case methods', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'post',
          pattern: 'users',
          params: [],
          file: '/api/users.post.ts',
        }),
      ];

      const match = matchRoute(routes, '/users', 'Post');

      expect(match).not.toBeNull();
    });
  });

  describe('multiple routes', () => {
    it('should return first matching route', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: 'users/:id',
          params: ['id'],
          file: '/api/users/[id].get.ts',
        }),
        createTestRoute({
          method: 'get',
          pattern: 'users/me',
          params: [],
          file: '/api/users/me.get.ts',
        }),
      ];

      // This will match the first route with params.id = 'me'
      const match = matchRoute(routes, '/users/me', 'get');

      expect(match).not.toBeNull();
      expect(match?.route.pattern).toBe('users/:id');
      expect(match?.params).toEqual({ id: 'me' });
    });

    it('should filter by method before matching', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: 'users',
          params: [],
          file: '/api/users.get.ts',
        }),
        createTestRoute({
          method: 'post',
          pattern: 'users',
          params: [],
          file: '/api/users.post.ts',
        }),
      ];

      const getMatch = matchRoute(routes, '/users', 'get');
      const postMatch = matchRoute(routes, '/users', 'post');

      expect(getMatch?.route.method).toBe('get');
      expect(postMatch?.route.method).toBe('post');
    });
  });

  describe('edge cases', () => {
    it('should handle empty routes array', () => {
      const match = matchRoute([], '/health', 'get');
      expect(match).toBeNull();
    });

    it('should handle root path', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: '',
          params: [],
          file: '/api/index.get.ts',
        }),
      ];

      const match = matchRoute(routes, '/', 'get');

      expect(match).not.toBeNull();
      expect(match?.route.pattern).toBe('');
    });

    it('should handle empty parameter values', () => {
      const routes: Route[] = [
        createTestRoute({
          method: 'get',
          pattern: 'users/:id',
          params: ['id'],
          file: '/api/users/[id].get.ts',
        }),
      ];

      // Edge case: URL with empty segment
      const match = matchRoute(routes, '/users/', 'get');
      expect(match).toBeNull();
    });
  });
});
