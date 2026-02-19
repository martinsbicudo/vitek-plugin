import { describe, it, expect } from 'vitest';
import {
  normalizeRoutePath,
  extractParamsFromPattern,
  patternToRegex,
} from './normalize-path.js';
import { normalizePath } from '../../shared/utils.js';

describe('normalizeRoutePath', () => {
  it('should convert [id] to :id', () => {
    expect(normalizeRoutePath('users/[id]')).toBe('users/:id');
  });

  it('should convert [...ids] to *ids', () => {
    expect(normalizeRoutePath('files/[...path]')).toBe('files/*path');
  });

  it('should handle multiple parameters', () => {
    expect(normalizeRoutePath('users/[userId]/posts/[postId]')).toBe('users/:userId/posts/:postId');
  });

  it('should handle index files', () => {
    expect(normalizeRoutePath('users/index')).toBe('users');
  });

  it('should handle root index', () => {
    expect(normalizeRoutePath('index')).toBe('');
  });

  it('should remove file extensions', () => {
    expect(normalizeRoutePath('users.ts')).toBe('users');
    expect(normalizeRoutePath('users.js')).toBe('users');
  });

  it('should handle mixed parameters and static segments', () => {
    expect(normalizeRoutePath('api/v1/users/[id]/profile')).toBe('api/v1/users/:id/profile');
  });

  it('should handle empty string', () => {
    expect(normalizeRoutePath('')).toBe('');
  });

  it('should handle Windows-style separators', () => {
    expect(normalizeRoutePath('users\\[id]')).toBe('users/:id');
  });

  it('should remove leading/trailing slashes', () => {
    expect(normalizeRoutePath('/users/[id]/')).toBe('users/:id');
  });
});

describe('extractParamsFromPattern', () => {
  it('should extract single parameter', () => {
    expect(extractParamsFromPattern('users/:id')).toEqual(['id']);
  });

  it('should extract multiple parameters', () => {
    expect(extractParamsFromPattern('users/:userId/posts/:postId')).toEqual(['userId', 'postId']);
  });

  it('should extract catch-all parameter', () => {
    expect(extractParamsFromPattern('files/*path')).toEqual(['path']);
  });

  it('should return empty array for no parameters', () => {
    expect(extractParamsFromPattern('health')).toEqual([]);
  });

  it('should extract mixed parameters', () => {
    expect(extractParamsFromPattern('users/:id/files/*path')).toEqual(['id', 'path']);
  });

  it('should handle empty string', () => {
    expect(extractParamsFromPattern('')).toEqual([]);
  });
});

describe('patternToRegex', () => {
  it('should match exact path', () => {
    const regex = patternToRegex('health');
    expect(regex.test('/health')).toBe(true);
    expect(regex.test('/health/')).toBe(false);
    expect(regex.test('/healthcheck')).toBe(false);
  });

  it('should match path with parameter', () => {
    const regex = patternToRegex('users/:id');
    expect(regex.test('/users/123')).toBe(true);
    expect(regex.test('/users/abc')).toBe(true);
    expect(regex.test('/users')).toBe(false);
    expect(regex.test('/users/')).toBe(false);
  });

  it('should capture parameter value', () => {
    const regex = patternToRegex('users/:id');
    const match = '/users/123'.match(regex);
    expect(match?.[1]).toBe('123');
  });

  it('should match catch-all parameter', () => {
    const regex = patternToRegex('files/*path');
    expect(regex.test('/files/docs/report.pdf')).toBe(true);
    expect(regex.test('/files')).toBe(false);
  });

  it('should capture catch-all value', () => {
    const regex = patternToRegex('files/*path');
    const match = '/files/docs/folder/file.txt'.match(regex);
    expect(match?.[1]).toBe('docs/folder/file.txt');
  });

  it('should match multiple parameters', () => {
    const regex = patternToRegex('users/:userId/posts/:postId');
    const match = '/users/42/posts/99'.match(regex);
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('42');
    expect(match?.[2]).toBe('99');
  });

  it('should handle special characters in parameters', () => {
    const regex = patternToRegex('files/:filename');
    expect(regex.test('/files/doc.pdf')).toBe(true);
    expect(regex.test('/files/image_v2.png')).toBe(true);
  });

  it('should not match partial segments', () => {
    const regex = patternToRegex('users/:id');
    expect(regex.test('/users/123/profile')).toBe(false);
  });

  it('should handle empty pattern', () => {
    const regex = patternToRegex('');
    expect(regex.test('/')).toBe(true);
    expect(regex.test('/anything')).toBe(false);
  });

  it('should anchor to start and end', () => {
    const regex = patternToRegex('users');
    expect(regex.test('/users')).toBe(true);
    expect(regex.test('/api/users')).toBe(false);
    expect(regex.test('/users/api')).toBe(false);
  });
});

describe('normalizePath (from utils)', () => {
  it('should normalize double slashes', () => {
    expect(normalizePath('users//profile')).toBe('users/profile');
  });

  it('should remove trailing slash', () => {
    expect(normalizePath('/users/')).toBe('/users');
  });

  it('should handle root path', () => {
    expect(normalizePath('/')).toBe('/');
  });

  it('should handle empty string', () => {
    expect(normalizePath('')).toBe('/');
  });

  it('should not modify already normalized paths', () => {
    expect(normalizePath('/api/v1/users')).toBe('/api/v1/users');
  });
});
