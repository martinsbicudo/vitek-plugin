/**
 * Post-build tests: verify vitek-plugin outputs after `pnpm run build`.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('vitek-plugin build outputs (prisma)', () => {
  it('dist/ exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
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

  it('resolves vitek-plugin subpath exports', async () => {
    const { getRoutes } = await import('vitek-plugin/introspection');
    expect(typeof getRoutes).toBe('function');
    const { vitek } = await import('vitek-plugin/plugin');
    expect(typeof vitek).toBe('function');
  });

  it('vitek-manifest.json exists', () => {
    const manifestPath = path.join(ROOT, 'dist', 'vitek-manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(content).toHaveProperty('routes');
    expect(content).toHaveProperty('middlewares');
    expect(content).toHaveProperty('sockets');
  });

  it('can load vitek-api.mjs and get routes', async () => {
    const apiBundle = path.join(ROOT, 'dist', 'vitek-api.mjs');
    const mod = await import(pathToFileURL(apiBundle).href);
    expect(mod.routes).toBeDefined();
    expect(Array.isArray(mod.routes)).toBe(true);
    expect(mod.routes.length).toBeGreaterThan(0);
  });
});
