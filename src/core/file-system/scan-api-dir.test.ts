import { describe, it, expect } from 'vitest';
import {
  deduplicateParsedRoutes,
  deduplicateParsedSockets,
  scanApiDirectory,
} from './scan-api-dir.js';
import type { ParsedRoute } from '../routing/route-parser.js';
import type { ParsedSocket } from '../routing/socket-parser.js';

function parsedRoute(
  pattern: string,
  method: string,
  params: string[] = [],
  file?: string
): ParsedRoute {
  return {
    method: method as ParsedRoute['method'],
    pattern,
    params,
    file: file ?? `/api/${pattern.replace(/:/g, '[id]')}.${method}.ts`,
  };
}

function parsedSocket(pattern: string, params: string[] = [], file?: string): ParsedSocket {
  return {
    pattern,
    params,
    file: file ?? `/api/${pattern.replace(/:/g, '[id]')}.socket.ts`,
  };
}

describe('deduplicateParsedRoutes', () => {
  it('returns empty array for empty input', () => {
    expect(deduplicateParsedRoutes([])).toEqual([]);
  });

  it('returns same array when no duplicates', () => {
    const routes = [
      parsedRoute('health', 'get'),
      parsedRoute('users/:id', 'get', ['id']),
      parsedRoute('flows/:id/run', 'post', ['id']),
    ];
    expect(deduplicateParsedRoutes(routes)).toHaveLength(3);
    expect(deduplicateParsedRoutes(routes)).toEqual(routes);
  });

  it('keeps first occurrence when duplicate routeKey', () => {
    const first = parsedRoute('flows/:id/run', 'post', ['id'], '/api/flows/[id]/run.post.ts');
    const second = parsedRoute('flows/:id/run', 'post', ['id'], '/other/path/run.post.ts');
    const result = deduplicateParsedRoutes([first, second]);
    expect(result).toHaveLength(1);
    expect(result[0].file).toBe(first.file);
  });

  it('deduplicates multiple duplicate keys', () => {
    const routes = [
      parsedRoute('intentions/detect', 'post', [], '/a/detect.post.ts'),
      parsedRoute('intentions/detect', 'post', [], '/b/detect.post.ts'),
      parsedRoute('teams/:id', 'put', ['id'], '/a/teams.put.ts'),
      parsedRoute('teams/:id', 'put', ['id'], '/b/teams.put.ts'),
      parsedRoute('health', 'get'),
    ];
    const result = deduplicateParsedRoutes(routes);
    expect(result).toHaveLength(3);
    expect(result.map((r) => `${r.method}:${r.pattern}`)).toEqual([
      'post:intentions/detect',
      'put:teams/:id',
      'get:health',
    ]);
  });

  it('same pattern different method is not duplicate', () => {
    const routes = [
      parsedRoute('flows/:id/versions', 'get', ['id']),
      parsedRoute('flows/:id/versions', 'post', ['id']),
    ];
    expect(deduplicateParsedRoutes(routes)).toHaveLength(2);
  });
});

describe('deduplicateParsedSockets', () => {
  it('returns empty array for empty input', () => {
    expect(deduplicateParsedSockets([])).toEqual([]);
  });

  it('returns same array when no duplicates', () => {
    const sockets = [
      parsedSocket('chat'),
      parsedSocket('rooms/:id', ['id']),
    ];
    expect(deduplicateParsedSockets(sockets)).toHaveLength(2);
  });

  it('keeps first occurrence when duplicate pattern', () => {
    const first = parsedSocket('chat', [], '/api/chat.socket.ts');
    const second = parsedSocket('chat', [], '/other/chat.socket.ts');
    const result = deduplicateParsedSockets([first, second]);
    expect(result).toHaveLength(1);
    expect(result[0].file).toBe(first.file);
  });

  it('deduplicates multiple duplicate patterns', () => {
    const sockets = [
      parsedSocket('notifications', [], '/a/notifications.socket.ts'),
      parsedSocket('notifications', [], '/b/notifications.socket.ts'),
      parsedSocket('presence', [], '/a/presence.socket.ts'),
      parsedSocket('presence', [], '/b/presence.socket.ts'),
    ];
    const result = deduplicateParsedSockets(sockets);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.pattern)).toEqual(['notifications', 'presence']);
  });
});

describe('scanApiDirectory', () => {
  it('returns result with routes, middlewares, sockets arrays', () => {
    const result = scanApiDirectory(__dirname);
    expect(result).toHaveProperty('routes');
    expect(result).toHaveProperty('middlewares');
    expect(result).toHaveProperty('sockets');
    expect(Array.isArray(result.routes)).toBe(true);
    expect(Array.isArray(result.middlewares)).toBe(true);
    expect(Array.isArray(result.sockets)).toBe(true);
  });

  it('returns no duplicate route keys', () => {
    const result = scanApiDirectory(__dirname);
    const keys = result.routes.map((r) => `${r.method}:${r.pattern}`);
    const uniqueKeys = [...new Set(keys)];
    expect(keys.length).toBe(uniqueKeys.length);
  });

  it('returns no duplicate socket patterns', () => {
    const result = scanApiDirectory(__dirname);
    const patterns = result.sockets.map((s) => s.pattern);
    const uniquePatterns = [...new Set(patterns)];
    expect(patterns.length).toBe(uniquePatterns.length);
  });
});
