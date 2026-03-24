/**
 * Post-build tests: verify vitek-plugin outputs after `pnpm run build`.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('vitek-plugin build outputs (js-react)', () => {
  it('dist/ exists with frontend bundle', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'index.html'))).toBe(true);
  });

  it('generated api.services.js exists', () => {
    const servicesPath = path.join(ROOT, 'src', 'api.services.js');
    expect(fs.existsSync(servicesPath)).toBe(true);
  });

  it('generated socket.services.js exists', () => {
    const socketPath = path.join(ROOT, 'src', 'socket.services.js');
    expect(fs.existsSync(socketPath)).toBe(true);
  });

  it('vitek-api.mjs bundle exists', () => {
    const apiBundle = path.join(ROOT, 'dist', 'vitek-api.mjs');
    expect(fs.existsSync(apiBundle)).toBe(true);
  });

  it('vitek-sockets.mjs bundle exists', () => {
    const socketsBundle = path.join(ROOT, 'dist', 'vitek-sockets.mjs');
    expect(fs.existsSync(socketsBundle)).toBe(true);
  });

  it('resolves vitek-plugin subpath exports', async () => {
    const { ok } = await import('vitek-plugin/response');
    expect(typeof ok).toBe('function');
    const { vitek } = await import('vitek-plugin/plugin');
    expect(typeof vitek).toBe('function');
  });

  it('can load vitek-api.mjs', async () => {
    const apiBundle = path.join(ROOT, 'dist', 'vitek-api.mjs');
    const mod = await import(pathToFileURL(apiBundle).href);
    expect(mod.routes).toBeDefined();
    expect(Array.isArray(mod.routes)).toBe(true);
  });

  it('health handler returns ok payload from bundle', async () => {
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
    expect(result.status).toBe('ok');
    expect(typeof result.timestamp).toBe('string');
    expect(typeof result.uptime).toBe('number');
  });
});
