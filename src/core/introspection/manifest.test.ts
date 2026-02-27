import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { getManifest, getRoutes, getSockets, writeManifest } from './manifest.js';

describe('manifest', () => {
  let rootDir: string;
  let apiDir: string;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(process.cwd(), 'vitek-manifest-test-'));
    apiDir = path.join(rootDir, 'src', 'api');
    fs.mkdirSync(apiDir, { recursive: true });
    fs.writeFileSync(path.join(apiDir, 'health.get.ts'), 'export default () => ({});');
  });

  afterEach(() => {
    try {
      fs.rmSync(rootDir, { recursive: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('getManifest returns routes, middlewares, sockets', () => {
    const manifest = getManifest(rootDir, 'src/api');
    expect(manifest).toHaveProperty('routes');
    expect(manifest).toHaveProperty('middlewares');
    expect(manifest).toHaveProperty('sockets');
    expect(Array.isArray(manifest.routes)).toBe(true);
    expect(Array.isArray(manifest.middlewares)).toBe(true);
    expect(Array.isArray(manifest.sockets)).toBe(true);
    expect(manifest.routes.length).toBeGreaterThan(0);
  });

  it('getRoutes returns ParsedRoute[]', () => {
    const routes = getRoutes(rootDir, 'src/api');
    expect(Array.isArray(routes)).toBe(true);
    routes.forEach((r) => {
      expect(r).toHaveProperty('method');
      expect(r).toHaveProperty('pattern');
      expect(r).toHaveProperty('params');
      expect(r).toHaveProperty('file');
    });
  });

  it('getSockets returns ParsedSocket[]', () => {
    const sockets = getSockets(rootDir, 'src/api');
    expect(Array.isArray(sockets)).toBe(true);
  });

  it('getManifest with non-existent apiDir returns empty arrays', () => {
    const manifest = getManifest(rootDir, 'non-existent-dir');
    expect(manifest.routes).toEqual([]);
    expect(manifest.middlewares).toEqual([]);
    expect(manifest.sockets).toEqual([]);
  });

  it('writeManifest writes vitek-manifest.json', () => {
    const outDir = path.join(rootDir, 'dist');
    const written = writeManifest(rootDir, 'src/api', outDir);
    expect(written).toBe(path.join(outDir, 'vitek-manifest.json'));
    expect(fs.existsSync(written)).toBe(true);
    const content = JSON.parse(fs.readFileSync(written, 'utf-8'));
    expect(content).toHaveProperty('routes');
    expect(content).toHaveProperty('middlewares');
    expect(content).toHaveProperty('sockets');
  });
});
