/**
 * Post-build tests: verify vitek-plugin outputs after `pnpm run build`.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('vitek-plugin build outputs (api-docs)', () => {
  it('dist/ exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
  });

  it('generated api.services.ts exists', () => {
    const servicesPath = path.join(ROOT, 'src', 'api.services.ts');
    expect(fs.existsSync(servicesPath)).toBe(true);
  });

  it('vitek-api.mjs bundle exists', () => {
    const apiBundle = path.join(ROOT, 'dist', 'vitek-api.mjs');
    expect(fs.existsSync(apiBundle)).toBe(true);
  });

  it('resolves vitek-plugin subpath exports', async () => {
    const { getManifest } = await import('vitek-plugin/introspection');
    expect(typeof getManifest).toBe('function');
    const { vitek } = await import('vitek-plugin/plugin');
    expect(typeof vitek).toBe('function');
  });

  it('can load vitek-api.mjs', async () => {
    const apiBundle = path.join(ROOT, 'dist', 'vitek-api.mjs');
    const mod = await import(pathToFileURL(apiBundle).href);
    expect(mod.routes).toBeDefined();
    expect(Array.isArray(mod.routes)).toBe(true);
  });

  it('openapi.json exists in public or dist', () => {
    const inPublic = path.join(ROOT, 'public', 'openapi.json');
    const inDist = path.join(ROOT, 'dist', 'openapi.json');
    const pathExists = fs.existsSync(inPublic) || fs.existsSync(inDist);
    expect(pathExists).toBe(true);
  });

  it('openapi.json has valid OpenAPI 3 structure', () => {
    const inPublic = path.join(ROOT, 'public', 'openapi.json');
    const inDist = path.join(ROOT, 'dist', 'openapi.json');
    const filePath = fs.existsSync(inPublic) ? inPublic : inDist;
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content.openapi).toBe('3.0.3');
    expect(content.info).toBeDefined();
    expect(content.info.title).toBeDefined();
    expect(content.paths).toBeDefined();
    expect(typeof content.paths).toBe('object');
    const pathKeys = Object.keys(content.paths);
    expect(pathKeys.length).toBeGreaterThan(0);
    expect(pathKeys.some((k) => k.toLowerCase().includes('health'))).toBe(true);
  });

  it('asyncapi.json exists in public or dist', () => {
    const inPublic = path.join(ROOT, 'public', 'asyncapi.json');
    const inDist = path.join(ROOT, 'dist', 'asyncapi.json');
    const pathExists = fs.existsSync(inPublic) || fs.existsSync(inDist);
    expect(pathExists).toBe(true);
  });

  it('asyncapi.json has valid AsyncAPI 2 structure', () => {
    const inPublic = path.join(ROOT, 'public', 'asyncapi.json');
    const inDist = path.join(ROOT, 'dist', 'asyncapi.json');
    const filePath = fs.existsSync(inPublic) ? inPublic : inDist;
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content.asyncapi).toBeDefined();
    expect(content.asyncapi).toMatch(/^2\./);
    expect(content.info).toBeDefined();
    expect(content.channels).toBeDefined();
    expect(typeof content.channels).toBe('object');
  });

  it('api-docs.html exists in public or dist', () => {
    const inPublic = path.join(ROOT, 'public', 'api-docs.html');
    const inDist = path.join(ROOT, 'dist', 'api-docs.html');
    const pathExists = fs.existsSync(inPublic) || fs.existsSync(inDist);
    expect(pathExists).toBe(true);
  });

  it('api-docs.html contains REST and WebSockets tabs', () => {
    const inPublic = path.join(ROOT, 'public', 'api-docs.html');
    const inDist = path.join(ROOT, 'dist', 'api-docs.html');
    const filePath = fs.existsSync(inPublic) ? inPublic : inDist;
    const html = fs.readFileSync(filePath, 'utf-8');
    expect(html).toContain('vitek-docs-tabs');
    expect(html).toContain('data-tab="rest"');
    expect(html).toContain('data-tab="websockets"');
    expect(html).toContain('swagger-ui');
  });
});
