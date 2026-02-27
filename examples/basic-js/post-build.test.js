/**
 * Post-build tests: verify vitek-plugin outputs after `pnpm run build`.
 * Run with: pnpm run build && pnpm test
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname; // test is in examples/<name>/, ROOT = project root of that example

describe('vitek-plugin build outputs (basic-js)', () => {
  it('dist/ exists with frontend bundle', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'index.html'))).toBe(true);
  });

  it('generated api.services.js exists', () => {
    const servicesPath = path.join(ROOT, 'src', 'api.services.js');
    expect(fs.existsSync(servicesPath)).toBe(true);
    const content = fs.readFileSync(servicesPath, 'utf-8');
    expect(content).toContain('getHealth');
    expect(content).toContain('getUsersId');
    expect(content).toContain('getCache');
  });

  it('generated socket.services.js exists (has sockets)', () => {
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

  it('can load vitek-api.mjs and get routes', async () => {
    const apiBundle = path.join(ROOT, 'dist', 'vitek-api.mjs');
    const mod = await import(pathToFileURL(apiBundle).href);
    expect(mod.routes).toBeDefined();
    expect(Array.isArray(mod.routes)).toBe(true);
    expect(mod.routes.length).toBeGreaterThan(0);
    expect(mod.middlewares).toBeDefined();
    expect(Array.isArray(mod.middlewares)).toBe(true);
  });

  it('includes cache route (GET /api/cache) with cache headers', async () => {
    const apiBundle = path.join(ROOT, 'dist', 'vitek-api.mjs');
    const mod = await import(pathToFileURL(apiBundle).href);
    const cacheRoute = mod.routes.find((r) => r.pattern === 'cache');
    expect(cacheRoute).toBeDefined();
    expect(cacheRoute.method?.toLowerCase()).toBe('get');
  });
});
