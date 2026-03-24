import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('observability example', () => {
  it('dist and bundle exist', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
  });

  it('resolves vitek-plugin subpaths including observability', async () => {
    const obs = await import('vitek-plugin/observability');
    expect(typeof obs.withSpan).toBe('function');
    const main = await import('vitek-plugin');
    expect(typeof main.withSpan).toBe('function');
    const response = await import('vitek-plugin/response');
    expect(typeof response.ok).toBe('function');
    const plugin = await import('vitek-plugin/plugin');
    expect(typeof plugin.vitek).toBe('function');
  });

  it('health route returns shape with requestId key', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find(
      (r: { pattern: string; method: string }) => r.pattern === 'health' && r.method === 'get'
    );
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    const result = await handler({
      params: {},
      query: {},
      headers: {},
      url: '',
      method: 'get',
      path: '/api/health',
      requestId: 'bundle-rid',
    });
    expect(result).toEqual({ status: 'ok', requestId: 'bundle-rid' });
  });
});
