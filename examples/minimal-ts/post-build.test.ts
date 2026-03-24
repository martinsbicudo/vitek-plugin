import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('minimal-ts example', () => {
  it('dist and bundle exist', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
  });

  it('resolves vitek-plugin subpath and barrel exports from linked package', async () => {
    const response = await import('vitek-plugin/response');
    expect(typeof response.ok).toBe('function');
    const plugin = await import('vitek-plugin/plugin');
    expect(typeof plugin.vitek).toBe('function');
    const testing = await import('vitek-plugin/testing');
    expect(typeof testing.createMockContext).toBe('function');
    const main = await import('vitek-plugin');
    expect(typeof main.isProduction).toBe('function');
    const events = await import('vitek-plugin/events');
    expect(typeof events.createEventBus).toBe('function');
    const scheduler = await import('vitek-plugin/scheduler');
    expect(typeof scheduler.defineSchedule).toBe('function');
    const generators = await import('vitek-plugin/generators');
    expect(typeof generators.generateCrudFiles).toBe('function');
    const doctor = await import('vitek-plugin/doctor');
    expect(typeof doctor.buildDoctorReport).toBe('function');
    const dispatch = await import('vitek-plugin/dispatch');
    expect(typeof dispatch.emitIssueSafe).toBe('function');
    const platform = await import('vitek-plugin/platform');
    expect(typeof platform.loadPlatformConfig).toBe('function');
    const observability = await import('vitek-plugin/observability');
    expect(typeof observability.withSpan).toBe('function');
  });

  it('vitek contract check passes against committed snapshot', () => {
    execSync('pnpm exec vitek contract check', {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  });

  it('health route returns ok with ts', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find((r: { pattern: string; method: string }) => r.pattern === 'health' && r.method === 'get');
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    const result = await handler({ params: {}, query: {}, headers: {}, url: '', method: 'get', path: '/api/health' });
    expect(result).toEqual({ status: 'ok', ts: true });
  });
});
