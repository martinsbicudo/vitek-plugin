import { describe, it, expect } from 'vitest';
import { normalizePath, isHttpMethod, capitalize } from './utils.js';

describe('normalizePath', () => {
  it('collapses multiple slashes to one', () => {
    expect(normalizePath('/a//b///c')).toBe('/a/b/c');
    expect(normalizePath('a//b')).toBe('a/b');
  });

  it('removes trailing slash except for root', () => {
    expect(normalizePath('/foo/')).toBe('/foo');
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('bar/')).toBe('bar');
  });

  it('returns root for empty string', () => {
    expect(normalizePath('')).toBe('/');
  });

  it('preserves leading slash', () => {
    expect(normalizePath('/api/health')).toBe('/api/health');
  });
});

describe('isHttpMethod', () => {
  it('returns true for valid HTTP methods (case insensitive)', () => {
    expect(isHttpMethod('get')).toBe(true);
    expect(isHttpMethod('GET')).toBe(true);
    expect(isHttpMethod('post')).toBe(true);
    expect(isHttpMethod('Put')).toBe(true);
    expect(isHttpMethod('patch')).toBe(true);
    expect(isHttpMethod('delete')).toBe(true);
    expect(isHttpMethod('head')).toBe(true);
    expect(isHttpMethod('options')).toBe(true);
  });

  it('returns false for invalid methods', () => {
    expect(isHttpMethod('')).toBe(false);
    expect(isHttpMethod('connect')).toBe(false);
    expect(isHttpMethod('trace')).toBe(false);
    expect(isHttpMethod('invalid')).toBe(false);
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('leaves rest unchanged', () => {
    expect(capitalize('hELLO')).toBe('HELLO');
  });

  it('handles single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });
});
