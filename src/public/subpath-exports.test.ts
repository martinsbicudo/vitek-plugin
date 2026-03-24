import { describe, it, expect } from 'vitest';
import { pathToFileURL } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPublic = path.resolve(__dirname, '../../dist/public');

describe.skipIf(!fs.existsSync(distPublic))('subpath exports', () => {
  it('vitek-plugin/plugin exports vitek', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'plugin.js')).href);
    expect(typeof mod.vitek).toBe('function');
  });

  it('vitek-plugin/response exports response helpers', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'response.js')).href);
    expect(typeof mod.json).toBe('function');
    expect(typeof mod.ok).toBe('function');
    expect(typeof mod.notFound).toBe('function');
    expect(typeof mod.cacheControl).toBe('function');
  });

  it('vitek-plugin/errors exports error classes', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'errors.js')).href);
    expect(mod.VitekError).toBeDefined();
    expect(mod.HttpError).toBeDefined();
    expect(mod.NotFoundError).toBeDefined();
    expect(mod.ValidationError).toBeDefined();
  });

  it('vitek-plugin/validation exports validate and schema types', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'validation.js')).href);
    expect(typeof mod.validate).toBe('function');
    expect(typeof mod.validateBody).toBe('function');
    expect(typeof mod.validateQuery).toBe('function');
    expect(typeof mod.validateOrThrow).toBe('function');
  });

  it('vitek-plugin/introspection exports manifest helpers', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'introspection.js')).href);
    expect(typeof mod.getManifest).toBe('function');
    expect(typeof mod.getRoutes).toBe('function');
    expect(typeof mod.getSockets).toBe('function');
    expect(typeof mod.writeManifest).toBe('function');
  });

  it('vitek-plugin/testing exports mock helpers', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'testing.js')).href);
    expect(typeof mod.createMockContext).toBe('function');
    expect(typeof mod.createMockReq).toBe('function');
    expect(typeof mod.createMockRes).toBe('function');
    expect(typeof mod.runMiddlewareChain).toBe('function');
  });

  it('vitek-plugin/events exports createEventBus', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'events.js')).href);
    expect(typeof mod.createEventBus).toBe('function');
  });

  it('vitek-plugin/scheduler exports scheduler helpers', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'scheduler.js')).href);
    expect(typeof mod.defineSchedule).toBe('function');
    expect(typeof mod.runScheduleOnce).toBe('function');
    expect(mod.InMemoryLockProvider).toBeDefined();
  });

  it('vitek-plugin/generators exports generateCrudFiles', async () => {
    const mod = await import(pathToFileURL(path.join(distPublic, 'generators.js')).href);
    expect(typeof mod.generateCrudFiles).toBe('function');
  });
});
