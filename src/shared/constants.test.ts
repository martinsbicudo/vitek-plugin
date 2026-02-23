import { describe, it, expect } from 'vitest';
import { getSocketBasePath, API_BASE_PATH } from './constants.js';

describe('getSocketBasePath', () => {
  it('should return default /api/ws when no options', () => {
    expect(getSocketBasePath()).toBe('/api/ws');
  });

  it('should use apiBasePath when provided', () => {
    expect(getSocketBasePath('/v1')).toBe('/v1/ws');
    expect(getSocketBasePath('/api')).toBe('/api/ws');
  });

  it('should strip trailing slash from apiBasePath before adding /ws', () => {
    expect(getSocketBasePath('/api/')).toBe('/api/ws');
  });

  it('should use customSocketPath as-is when it starts with /', () => {
    expect(getSocketBasePath(undefined, '/ws')).toBe('/ws');
    expect(getSocketBasePath('/api', '/custom')).toBe('/custom');
  });

  it('should prefix customSocketPath with / when it does not start with /', () => {
    expect(getSocketBasePath(undefined, 'ws')).toBe('/ws');
  });

  it('should prefer customSocketPath over apiBasePath', () => {
    expect(getSocketBasePath('/api', '/ws')).toBe('/ws');
  });

  it('should return default when customSocketPath is empty string', () => {
    expect(getSocketBasePath(undefined, '')).toBe('/api/ws');
  });

  it('should return default when customSocketPath is null/undefined', () => {
    expect(getSocketBasePath(undefined, undefined)).toBe('/api/ws');
    expect(getSocketBasePath()).toBe(API_BASE_PATH + '/ws');
  });
});
