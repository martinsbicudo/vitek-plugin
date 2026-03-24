/**
 * Post-build tests: verify vitek-plugin outputs after `pnpm run build`.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('vitek-plugin build outputs (docker)', () => {
  it('dist/ exists with frontend bundle', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'index.html'))).toBe(true);
  });

  it('generated api.services.ts exists', () => {
    const servicesPath = path.join(ROOT, 'src', 'api.services.ts');
    expect(fs.existsSync(servicesPath)).toBe(true);
  });

  it('generated api.types.ts exists', () => {
    const typesPath = path.join(ROOT, 'src', 'api.types.ts');
    expect(fs.existsSync(typesPath)).toBe(true);
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
    const { HttpError } = await import('vitek-plugin/errors');
    expect(typeof HttpError).toBe('function');
    const { ok } = await import('vitek-plugin/response');
    expect(typeof ok).toBe('function');
  });

  it('can load vitek-api.mjs and get routes', async () => {
    const apiBundle = path.join(ROOT, 'dist', 'vitek-api.mjs');
    const mod = await import(pathToFileURL(apiBundle).href);
    expect(mod.routes).toBeDefined();
    expect(Array.isArray(mod.routes)).toBe(true);
    expect(mod.middlewares).toBeDefined();
  });

  it('dist/vitek.config.mjs exists after build', () => {
    const configPath = path.join(ROOT, 'dist', 'vitek.config.mjs');
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('vitek.config.mjs exports beforeApiRequest and onError', async () => {
    const configPath = path.join(ROOT, 'dist', 'vitek.config.mjs');
    const mod = await import(pathToFileURL(configPath).href);
    expect(typeof mod.beforeApiRequest).toBe('function');
    expect(typeof mod.onError).toBe('function');
  });

  it('health handler resolves relative lib import in bundle', async () => {
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
    expect(result.version).toBe('1.0.0-docker');
    expect(typeof result.timestamp).toBe('string');
  });
});
