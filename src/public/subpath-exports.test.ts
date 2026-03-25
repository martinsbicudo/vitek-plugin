import { describe, it, expect, vi } from 'vitest';
import { pathToFileURL } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPublic = path.resolve(__dirname, '../../dist/public');

describe.skipIf(!fs.existsSync(distPublic))('subpath exports', () => {
  it('vitek-plugin/plugin exports vitek that returns plugin array', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'plugin.js')).href);
    const plugins = mod.vitek();
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
    expect(plugins.some((p: { name?: string }) => p?.name === 'vitek:dev')).toBe(true);
  }, 15000);

  it('vitek-plugin/response helpers return structured responses', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'response.js')).href);
    const ok = mod.ok({ x: 1 });
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ x: 1 });
    const nf = mod.notFound();
    expect(nf.status).toBe(404);
  });

  it('vitek-plugin/errors constructs HttpError with status', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'errors.js')).href);
    const err = new mod.NotFoundError('missing');
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe('NotFoundError');
  });

  it('vitek-plugin/validation validateOrThrow fails on invalid data', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'validation.js')).href);
    expect(() =>
      mod.validateOrThrow({}, { name: { type: 'string', required: true } })
    ).toThrow(mod.ValidationError);
  });

  it('vitek-plugin/introspection getManifest reflects api routes on disk', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'introspection.js')).href);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-intro-'));
    const apiDir = path.join(root, 'src', 'api');
    fs.mkdirSync(apiDir, { recursive: true });
    fs.writeFileSync(path.join(apiDir, 'ping.get.ts'), 'export default () => ({ p: 1 })\n', 'utf-8');
    const manifest = mod.getManifest(root, 'src/api');
    expect(manifest.routes.some((r: { pattern: string }) => r.pattern === 'ping')).toBe(true);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('vitek-plugin/testing createMockContext has stable defaults', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'testing.js')).href);
    const ctx = mod.createMockContext();
    expect(ctx.method).toBe('get');
    expect(ctx.path).toContain('/api/');
    expect(ctx.params).toEqual({});
  });

  it('vitek-plugin/events bus delivers payloads', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'events.js')).href);
    type Ev = { tick: { n: number } };
    const bus = mod.createEventBus<Ev>();
    let n = 0;
    bus.on('tick', (p) => {
      n = p.n;
    });
    await bus.emit('tick', { n: 42 });
    expect(n).toBe(42);
  });

  it('vitek-plugin/scheduler defineSchedule returns definition', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'scheduler.js')).href);
    const def = mod.defineSchedule({ tasks: [{ name: 't', cron: '* * * * *', run: async () => {} }] });
    expect(def.tasks).toHaveLength(1);
    expect(def.tasks[0].name).toBe('t');
  });

  it('vitek-plugin/generators exports callable generateCrudFiles', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'generators.js')).href);
    expect(typeof mod.generateCrudFiles).toBe('function');
  });

  it('vitek-plugin/doctor buildDoctorReport returns bounded score', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'doctor.js')).href);
    const platform = await import(pathToFileURL(path.join(distPublic, 'platform.js')).href);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-doc-'));
    fs.writeFileSync(path.join(root, 'note.txt'), 'x', 'utf-8');
    const cfg = platform.loadPlatformConfig(root);
    const report = mod.buildDoctorReport(root, cfg);
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.dimensions.length).toBeGreaterThan(0);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('vitek-plugin/dispatch console dispatcher emits json line', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'dispatch.js')).href);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const d = mod.createConsoleIssueDispatcher();
    d.dispatch({
      id: 'id-1',
      timestamp: new Date().toISOString(),
      severity: 'info',
      source: 'manual',
      title: 't',
      message: 'm',
    });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const row = JSON.parse(logSpy.mock.calls[0][0] as string) as { event: string; title: string };
    expect(row.event).toBe('issue.dispatch');
    expect(row.title).toBe('t');
    logSpy.mockRestore();
  });

  it('vitek-plugin/platform mergePlatformConfig merges feature flags', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'platform.js')).href);
    const cfg = mod.mergePlatformConfig({ features: { observability: true } });
    expect(cfg.features.observability).toBe(true);
    expect(mod.isFeatureEnabled(cfg, 'observability')).toBe(true);
  });

  it('vitek-plugin/observability withSpan resolves callback result', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'observability.js')).href);
    const v = await mod.withSpan('x', async () => ({ r: 2 }));
    expect(v).toEqual({ r: 2 });
  });
});
