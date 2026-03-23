import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('minimal-ts example', () => {
  it('dist and bundle exist', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
  });

  it('resolves vitek-plugin subpath and barrel exports from linked package', async () => {
    const response = await import('vitek-plugin/response');
    expect(typeof response.ok).toBe('function');
    const plugin = await import('vitek-plugin/plugin');
    expect(typeof plugin.vitek).toBe('function');
    const testing = await import('vitek-plugin/testing');
    expect(typeof testing.createMockContext).toBe('function');
    const main = await import('vitek-plugin');
    expect(typeof main.isProduction).toBe('function');
  });

  it('health route returns ok with ts', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find((r: { pattern: string; method: string }) => r.pattern === 'health' && r.method === 'get');
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    const result = await handler({ params: {}, query: {}, headers: {}, url: '', method: 'get', path: '/api/health' });
    expect(result).toEqual({ status: 'ok', ts: true });
  });
});
