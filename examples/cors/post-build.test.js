import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('cors example', () => {
  it('dist and bundle exist', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
  });

  it('resolves vitek-plugin subpath exports', async () => {
    const { ok } = await import('vitek-plugin/response');
    expect(typeof ok).toBe('function');
    const { vitek } = await import('vitek-plugin/plugin');
    expect(typeof vitek).toBe('function');
  });

  it('vite.config sets cors origin and methods', () => {
    const src = fs.readFileSync(path.join(ROOT, 'vite.config.js'), 'utf8');
    expect(src).toContain('cors');
    expect(src).toContain('http://localhost:3000');
    expect(src).toContain('GET');
    expect(src).toContain('POST');
    expect(src).toContain('Content-Type');
  });

  it('health handler returns ok from bundle', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find((r) => r.pattern === 'health' && r.method === 'get');
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    const result = await handler({
      params: {},
      query: {},
      headers: {},
      url: '',
      method: 'get',
      path: '/api/health',
    });
    expect(result).toEqual({ status: 'ok' });
  });
});
