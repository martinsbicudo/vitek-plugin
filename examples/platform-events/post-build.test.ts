import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('platform-events example', () => {
  it('dist and api bundle exist', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
  });

  it('events subpath resolves', async () => {
    const events = await import('vitek-plugin/events');
    expect(typeof events.createEventBus).toBe('function');
  });

  it('audit-log route returns entries array from bundle', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find(
      (r: { pattern: string; method: string }) => r.pattern === 'audit-log' && r.method === 'get'
    );
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    const result = await handler({
      params: {},
      query: {},
      headers: {},
      url: '',
      method: 'get',
      path: '/api/audit-log',
    });
    expect(Array.isArray(result.entries)).toBe(true);
  });
});
