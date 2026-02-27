import { describe, it, expect } from 'vitest';
import { getApplicableMiddlewares, matchPathPattern, type LoadedMiddleware } from './get-applicable-middlewares.js';
import type { Middleware } from '../routing/route-types.js';

function noopMiddleware(): Middleware {
  return async (_ctx, next) => next();
}

describe('getApplicableMiddlewares', () => {
  it('returns global middleware for any route when basePattern is empty', () => {
    const global = noopMiddleware();
    const middlewares: LoadedMiddleware[] = [
      { basePattern: '', middleware: [global] },
    ];
    expect(getApplicableMiddlewares(middlewares, '')).toEqual([global]);
    expect(getApplicableMiddlewares(middlewares, 'posts')).toEqual([global]);
    expect(getApplicableMiddlewares(middlewares, 'posts/1')).toEqual([global]);
  });

  it('returns no middleware for empty route when only specific middlewares exist', () => {
    const mw = noopMiddleware();
    const middlewares: LoadedMiddleware[] = [
      { basePattern: 'posts', middleware: [mw] },
    ];
    expect(getApplicableMiddlewares(middlewares, '')).toEqual([]);
  });

  it('applies middleware when route matches basePattern exactly', () => {
    const mw = noopMiddleware();
    const middlewares: LoadedMiddleware[] = [
      { basePattern: 'posts', middleware: [mw] },
    ];
    expect(getApplicableMiddlewares(middlewares, 'posts')).toEqual([mw]);
  });

  it('applies middleware when route is prefix of basePattern', () => {
    const mw = noopMiddleware();
    const middlewares: LoadedMiddleware[] = [
      { basePattern: 'posts', middleware: [mw] },
    ];
    expect(getApplicableMiddlewares(middlewares, 'posts/1')).toEqual([mw]);
    expect(getApplicableMiddlewares(middlewares, 'posts/1/comments')).toEqual([mw]);
  });

  it('does not apply when route does not start with basePattern', () => {
    const mw = noopMiddleware();
    const middlewares: LoadedMiddleware[] = [
      { basePattern: 'posts/:id', middleware: [mw] },
    ];
    expect(getApplicableMiddlewares(middlewares, 'posts')).toEqual([]);
    expect(getApplicableMiddlewares(middlewares, 'users')).toEqual([]);
  });

  it('normalizes leading/trailing slashes in patterns', () => {
    const mw = noopMiddleware();
    const middlewares: LoadedMiddleware[] = [
      { basePattern: '/posts/', middleware: [mw] },
    ];
    expect(getApplicableMiddlewares(middlewares, 'posts')).toEqual([mw]);
    expect(getApplicableMiddlewares(middlewares, 'posts/1')).toEqual([mw]);
  });

  it('returns middlewares in order (global first, then specific)', () => {
    const global = noopMiddleware();
    const postsMw = noopMiddleware();
    const postsIdMw = noopMiddleware();
    const middlewares: LoadedMiddleware[] = [
      { basePattern: '', middleware: [global] },
      { basePattern: 'posts', middleware: [postsMw] },
      { basePattern: 'posts/:id', middleware: [postsIdMw] },
    ];
    const result = getApplicableMiddlewares(middlewares, 'posts/:id');
    expect(result).toEqual([global, postsMw, postsIdMw]);
  });

  it('returns multiple middlewares from same loaded middleware', () => {
    const mw1 = noopMiddleware();
    const mw2 = noopMiddleware();
    const middlewares: LoadedMiddleware[] = [
      { basePattern: 'posts', middleware: [mw1, mw2] },
    ];
    expect(getApplicableMiddlewares(middlewares, 'posts/1')).toEqual([mw1, mw2]);
  });

  describe('global middleware with pathPatterns', () => {
    it('applies only to routes matching pathPatterns when set', () => {
      const globalMw = noopMiddleware();
      const middlewares: LoadedMiddleware[] = [
        { basePattern: '', middleware: [globalMw], pathPatterns: ['protected/*', 'admin'] },
      ];
      expect(getApplicableMiddlewares(middlewares, 'protected')).toEqual([globalMw]);
      expect(getApplicableMiddlewares(middlewares, 'protected/1')).toEqual([globalMw]);
      expect(getApplicableMiddlewares(middlewares, 'admin')).toEqual([globalMw]);
      expect(getApplicableMiddlewares(middlewares, 'admin/users')).toEqual([globalMw]);
      expect(getApplicableMiddlewares(middlewares, 'posts')).toEqual([]);
      expect(getApplicableMiddlewares(middlewares, 'health')).toEqual([]);
    });

    it('global without pathPatterns still applies to all routes', () => {
      const globalMw = noopMiddleware();
      const middlewares: LoadedMiddleware[] = [
        { basePattern: '', middleware: [globalMw] },
      ];
      expect(getApplicableMiddlewares(middlewares, 'posts')).toEqual([globalMw]);
      expect(getApplicableMiddlewares(middlewares, 'any/route')).toEqual([globalMw]);
    });
  });
});

describe('matchPathPattern', () => {
  it('matches exact pattern', () => {
    expect(matchPathPattern('admin', 'admin')).toBe(true);
    expect(matchPathPattern('admin/users', 'admin')).toBe(true);
    expect(matchPathPattern('posts', 'admin')).toBe(false);
  });

  it('matches glob pattern with /*', () => {
    expect(matchPathPattern('protected', 'protected/*')).toBe(true);
    expect(matchPathPattern('protected/1', 'protected/*')).toBe(true);
    expect(matchPathPattern('protected/1/2', 'protected/*')).toBe(true);
    expect(matchPathPattern('posts', 'protected/*')).toBe(false);
  });
});
