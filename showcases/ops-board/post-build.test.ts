import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe.sequential('ops-board showcase', () => {
  it('dist and API bundle exist', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
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
    });
    expect(result).toEqual({ status: 'ok', app: 'ops-board' });
  });

  it('POST /tasks rejects invalid body with 422', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find(
      (r: { pattern: string; method: string }) => r.pattern === 'tasks' && r.method === 'post'
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
        path: '/api/tasks',
      });
      expect.fail('expected ValidationError');
    } catch (e: unknown) {
      expect(e).toMatchObject({ statusCode: 422 });
    }
  });

  it('POST /tasks creates task when body is valid', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find(
      (r: { pattern: string; method: string }) => r.pattern === 'tasks' && r.method === 'post'
    );
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    const result = await handler({
      body: { teamId: 'eng', title: 'Vitest task' },
      params: {},
      query: {},
      headers: {},
      url: '',
      method: 'post',
      path: '/api/tasks',
    });
    expect(result.task).toMatchObject({
      teamId: 'eng',
      title: 'Vitest task',
      status: 'todo',
    });
    expect(result.task.id).toBeTruthy();
  });

  it('admin summary handler returns counts', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find(
      (r: { pattern: string; method: string }) =>
        r.pattern === 'admin/summary' && r.method === 'get'
    );
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    const result = await handler({
      params: {},
      query: {},
      headers: {},
      url: '',
      method: 'get',
      path: '/api/admin/summary',
    });
    expect(result.teams).toBe(2);
    expect(result.tasks).toBeGreaterThanOrEqual(1);
    expect(result.byStatus).toMatchObject({ todo: expect.any(Number), doing: expect.any(Number), done: expect.any(Number) });
  });
});
