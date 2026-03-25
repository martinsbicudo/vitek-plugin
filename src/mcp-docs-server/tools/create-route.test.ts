import { describe, it, expect } from 'vitest';
import { pathToRouteFilePath } from './create-route.js';

describe('pathToRouteFilePath', () => {
  it('returns index.get.ts for empty path and get', () => {
    const { filePath, snippet } = pathToRouteFilePath('', 'get');
    expect(filePath).toBe('src/api/index.get.ts');
    expect(snippet).toContain('VitekContext');
    expect(snippet).toContain('message: "ok"');
  });

  it('returns users/[id].get.ts for users/[id] and get', () => {
    const { filePath } = pathToRouteFilePath('users/[id]', 'get');
    expect(filePath).toBe('src/api/users/[id].get.ts');
  });

  it('accepts users/:id and produces [id] in path', () => {
    const { filePath, snippet } = pathToRouteFilePath('users/:id', 'get');
    expect(filePath).toBe('src/api/users/[id].get.ts');
    expect(snippet).toContain('params.id');
  });

  it('returns custom apiDir when provided', () => {
    const { filePath } = pathToRouteFilePath('health', 'get', 'lib/api');
    expect(filePath).toBe('lib/api/health.get.ts');
  });

  it('handles posts/[...ids] for catch-all', () => {
    const { filePath, snippet } = pathToRouteFilePath('posts/[...ids]', 'get');
    expect(filePath).toBe('src/api/posts/[...ids].get.ts');
    expect(snippet).toContain('params.ids');
  });

  it('throws for invalid method', () => {
    expect(() => pathToRouteFilePath('users', 'invalid')).toThrow('Invalid method');
  });
});
