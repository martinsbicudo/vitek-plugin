import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe.sequential('stock-pulse showcase', () => {
  it('dist and API bundle exist', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
  });

  it('socket bundle exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-sockets.mjs'))).toBe(true);
  });

  it('openapi snapshot exists for contract check', () => {
    const snap = path.join(ROOT, '.vitek', 'contract', 'openapi.snapshot.json');
    expect(fs.existsSync(snap)).toBe(true);
    const doc = JSON.parse(fs.readFileSync(snap, 'utf-8'));
    expect(doc.openapi).toBeDefined();
    expect(typeof doc.paths).toBe('object');
  });

  it('asyncapi snapshot exists when sockets are present', () => {
    const snap = path.join(ROOT, '.vitek', 'contract', 'asyncapi.snapshot.json');
    expect(fs.existsSync(snap)).toBe(true);
    const doc = JSON.parse(fs.readFileSync(snap, 'utf-8'));
    expect(doc.asyncapi).toBeDefined();
  });

  it('vitek contract check passes', () => {
    execSync('pnpm exec vitek contract check', {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  });

  it('health handler returns showcase payload', async () => {
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
    });
    expect(result).toEqual({ status: 'ok', app: 'stock-pulse' });
  });

  it('POST /movements rejects invalid body with 422', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find(
      (r: { pattern: string; method: string }) => r.pattern === 'movements' && r.method === 'post'
    );
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    try {
      await handler({
        body: {},
        params: {},
        query: {},
        headers: {},
        url: '',
        method: 'post',
        path: '/api/movements',
      });
      expect.fail('expected ValidationError');
    } catch (e: unknown) {
      expect(e).toMatchObject({ statusCode: 422 });
    }
  });

  it('POST /movements returns 409 when outbound exceeds stock', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find(
      (r: { pattern: string; method: string }) => r.pattern === 'movements' && r.method === 'post'
    );
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    try {
      await handler({
        body: { sku: 'SKU-100', kind: 'out', quantity: 99999 },
        params: {},
        query: {},
        headers: {},
        url: '',
        method: 'post',
        path: '/api/movements',
      });
      expect.fail('expected ConflictError');
    } catch (e: unknown) {
      expect(e).toMatchObject({ statusCode: 409 });
    }
  });

  it('POST /movements applies inbound movement', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find(
      (r: { pattern: string; method: string }) => r.pattern === 'movements' && r.method === 'post'
    );
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    const result = await handler({
      body: { sku: 'SKU-300', kind: 'in', quantity: 2 },
      params: {},
      query: {},
      headers: {},
      url: '',
      method: 'post',
      path: '/api/movements',
    });
    expect(result.item.sku).toBe('SKU-300');
    expect(result.item.quantity).toBeGreaterThanOrEqual(102);
  });

  it('socket bundle lists alerts pattern', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-sockets.mjs')).href);
    const patterns = mod.sockets.map((s: { pattern: string }) => s.pattern);
    expect(patterns).toContain('alerts');
  });
});
