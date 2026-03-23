/**
 * Post-build tests: verify vitek-plugin outputs after `pnpm run build`.
 * Run with: pnpm run build && pnpm test
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('vitek-plugin build outputs (typescript-react)', () => {
  it('dist/ exists with frontend bundle', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'index.html'))).toBe(true);
  });

  it('generated api.services.ts exists', () => {
    const servicesPath = path.join(ROOT, 'src', 'api.services.ts');
    expect(fs.existsSync(servicesPath)).toBe(true);
    const content = fs.readFileSync(servicesPath, 'utf-8');
    expect(content).toContain('getHealth');
    expect(content).toContain('getUsersId');
  });

  it('generated api.types.ts exists', () => {
    const typesPath = path.join(ROOT, 'src', 'api.types.ts');
    expect(fs.existsSync(typesPath)).toBe(true);
    const content = fs.readFileSync(typesPath, 'utf-8');
    expect(content).toContain('API_BASE_PATH');
    expect(content).toContain('VitekParams');
  });

  it('generated socket.services.ts exists', () => {
    const socketPath = path.join(ROOT, 'src', 'socket.services.ts');
    expect(fs.existsSync(socketPath)).toBe(true);
  });

  it('vitek-api.mjs bundle exists', () => {
    const apiBundle = path.join(ROOT, 'dist', 'vitek-api.mjs');
    expect(fs.existsSync(apiBundle)).toBe(true);
  });

  it('resolves vitek-plugin subpath exports', async () => {
    const { validateBody } = await import('vitek-plugin/validation');
    expect(typeof validateBody).toBe('function');
    const { json } = await import('vitek-plugin/response');
    expect(typeof json).toBe('function');
    const { isProduction } = await import('vitek-plugin');
    expect(isProduction({ mode: 'production' })).toBe(true);
  });

  it('vitek-sockets.mjs bundle exists', () => {
    const socketsBundle = path.join(ROOT, 'dist', 'vitek-sockets.mjs');
    expect(fs.existsSync(socketsBundle)).toBe(true);
  });

  it('can load vitek-api.mjs and get routes', async () => {
    const apiBundle = path.join(ROOT, 'dist', 'vitek-api.mjs');
    const mod = await import(pathToFileURL(apiBundle).href);
    expect(mod.routes).toBeDefined();
    expect(Array.isArray(mod.routes)).toBe(true);
    expect(mod.routes.length).toBeGreaterThan(0);
    expect(mod.middlewares).toBeDefined();
    expect(Array.isArray(mod.middlewares)).toBe(true);
    expect(mod.middlewares.length).toBeGreaterThan(0);
  });

  it('global middleware has path matcher (config.path)', async () => {
    const apiBundle = path.join(ROOT, 'dist', 'vitek-api.mjs');
    const mod = await import(pathToFileURL(apiBundle).href);
    const globalWithPath = mod.middlewares.find((m: { basePattern: string; pathPatterns?: string[] }) => m.basePattern === '' && m.pathPatterns?.length);
    expect(globalWithPath).toBeDefined();
    expect(globalWithPath.pathPatterns).toEqual(expect.arrayContaining(['users/*', 'posts/*']));
  });

  it('validate route returns 422 for invalid body when handler uses validateBody', async () => {
    const apiBundle = path.join(ROOT, 'dist', 'vitek-api.mjs');
    const mod = await import(pathToFileURL(apiBundle).href);
    const route = mod.routes.find((r: { pattern: string; method: string }) => r.pattern === 'validate' && r.method === 'post');
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    const ctx = { body: {}, params: {}, query: {}, headers: {}, url: '', method: 'post', path: '/api/validate' };
    try {
      await handler(ctx);
      expect.fail('expected ValidationError');
    } catch (e: unknown) {
      expect((e as { statusCode?: number }).statusCode).toBe(422);
    }
  });
});
