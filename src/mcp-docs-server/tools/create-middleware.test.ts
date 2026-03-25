import { describe, it, expect } from 'vitest';
import { pathToMiddlewareFilePath } from './create-middleware.js';

describe('pathToMiddlewareFilePath', () => {
  it('returns src/api/middleware.ts for empty basePattern', () => {
    const { filePath, snippet } = pathToMiddlewareFilePath('');
    expect(filePath).toBe('src/api/middleware.ts');
    expect(snippet).toContain('Middleware');
    expect(snippet).toContain('await next()');
  });

  it('returns src/api/users/middleware.ts for users', () => {
    const { filePath } = pathToMiddlewareFilePath('users');
    expect(filePath).toBe('src/api/users/middleware.ts');
  });

  it('returns src/api/posts/[id]/middleware.ts for posts/[id]', () => {
    const { filePath } = pathToMiddlewareFilePath('posts/[id]');
    expect(filePath).toBe('src/api/posts/[id]/middleware.ts');
  });

  it('uses custom apiDir when provided', () => {
    const { filePath } = pathToMiddlewareFilePath('users', 'lib/api');
    expect(filePath).toBe('lib/api/users/middleware.ts');
  });
});
