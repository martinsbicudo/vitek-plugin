import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe.sequential('reliable-api showcase', () => {
  it('dist API bundle and production vitek.config exist', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek.config.mjs'))).toBe(true);
  });

  it('openapi snapshot exists for contract check', () => {
    const snap = path.join(ROOT, '.vitek', 'contract', 'openapi.snapshot.json');
    expect(fs.existsSync(snap)).toBe(true);
    const doc = JSON.parse(fs.readFileSync(snap, 'utf-8'));
    expect(doc.openapi).toBeDefined();
    expect(typeof doc.paths).toBe('object');
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
      requestId: 'test-req',
    });
    expect(result).toMatchObject({ status: 'ok', app: 'reliable-api', requestId: 'test-req' });
  });

  it('POST /webhooks rejects invalid body with 422', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find(
      (r: { pattern: string; method: string }) => r.pattern === 'webhooks' && r.method === 'post'
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
        path: '/api/webhooks',
      });
      expect.fail('expected ValidationError');
    } catch (e: unknown) {
      expect(e).toMatchObject({ statusCode: 422 });
    }
  });

  it('GET /internal/issues with token returns issues list', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find(
      (r: { pattern: string; method: string }) => r.pattern === 'internal/issues' && r.method === 'get'
    );
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    const result = await handler({
      params: {},
      query: {},
      headers: { 'x-internal-token': 'reliable-api-demo' },
      url: '',
      method: 'get',
      path: '/api/internal/issues',
    });
    expect(result).toEqual({ issues: [] });
  });

  it('report/slow returns withSpan payload', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find(
      (r: { pattern: string; method: string }) => r.pattern === 'report/slow' && r.method === 'get'
    );
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    const result = await handler({
      params: {},
      query: {},
      headers: {},
      url: '',
      method: 'get',
      path: '/api/report/slow',
    });
    expect(result).toMatchObject({ report: 'ok', via: 'withSpan' });
  });

  it('crash handler throws unhandled Error', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find(
      (r: { pattern: string; method: string }) => r.pattern === 'crash' && r.method === 'get'
    );
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    await expect(
      Promise.resolve().then(() =>
        handler({
          params: {},
          query: {},
          headers: {},
          url: '',
          method: 'get',
          path: '/api/crash',
        })
      )
    ).rejects.toThrow(/intentional unhandled error/);
  });

  it('vitek doctor --json returns a valid report', () => {
    const out = execSync('pnpm exec vitek doctor --json', {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const report = JSON.parse(out.trim()) as {
      score: number;
      dimensions: Array<{ name: string; score: number; max: number }>;
      topActions: string[];
    };
    expect(typeof report.score).toBe('number');
    expect(report.dimensions.length).toBeGreaterThan(0);
    expect(Array.isArray(report.topActions)).toBe(true);
  });
});
