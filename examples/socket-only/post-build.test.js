/**
 * Post-build tests: verify vitek-plugin outputs after `pnpm run build`.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('vitek-plugin build outputs (socket-only)', () => {
  it('dist/ exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
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
    const { notFound } = await import('vitek-plugin/response');
    expect(typeof notFound).toBe('function');
    const { vitek } = await import('vitek-plugin/plugin');
    expect(typeof vitek).toBe('function');
  });

  it('can load vitek-sockets.mjs and get sockets', async () => {
    const socketsBundle = path.join(ROOT, 'dist', 'vitek-sockets.mjs');
    const mod = await import(pathToFileURL(socketsBundle).href);
    expect(mod.sockets).toBeDefined();
    expect(Array.isArray(mod.sockets)).toBe(true);
  });

  it('socket bundle lists root and chat patterns', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-sockets.mjs')).href);
    const patterns = mod.sockets.map((s) => s.pattern);
    expect(patterns).toEqual(expect.arrayContaining(['', 'chat']));
    expect(mod.sockets.length).toBeGreaterThanOrEqual(2);
  });
});
