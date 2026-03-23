import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseArgs, loadProductionConfig } from './serve.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('parseArgs', () => {
  const originalEnv = { ...process.env };
  const originalArgv = [...process.argv];

  beforeEach(() => {
    process.argv = ['node', 'vitek-serve'];
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    process.argv = originalArgv;
  });

  it('uses default dir, port, host when no args or env', () => {
    delete process.env.PORT;
    delete process.env.HOST;
    process.argv = ['node', 'vitek-serve'];
    const result = parseArgs();
    expect(result.dir).toBe('dist');
    expect(result.port).toBe(3000);
    expect(result.host).toBe('0.0.0.0');
    expect(result.cors).toBe(false);
    expect(result.trustProxy).toBe(false);
    expect(result.mode).toBeUndefined();
  });

  it('uses process.env.PORT when --port not passed', () => {
    process.env.PORT = '8080';
    delete process.env.HOST;
    process.argv = ['node', 'vitek-serve'];
    const result = parseArgs();
    expect(result.port).toBe(8080);
    expect(result.host).toBe('0.0.0.0');
  });

  it('uses process.env.HOST when --host not passed', () => {
    delete process.env.PORT;
    process.env.HOST = '127.0.0.1';
    process.argv = ['node', 'vitek-serve'];
    const result = parseArgs();
    expect(result.port).toBe(3000);
    expect(result.host).toBe('127.0.0.1');
  });

  it('--port overrides process.env.PORT', () => {
    process.env.PORT = '8080';
    process.argv = ['node', 'vitek-serve', '--port', '4000'];
    const result = parseArgs();
    expect(result.port).toBe(4000);
  });

  it('--host overrides process.env.HOST', () => {
    process.env.HOST = '127.0.0.1';
    process.argv = ['node', 'vitek-serve', '--host', '0.0.0.0'];
    const result = parseArgs();
    expect(result.host).toBe('0.0.0.0');
  });

  it('invalid PORT falls back to 3000', () => {
    process.env.PORT = 'not-a-number';
    process.argv = ['node', 'vitek-serve'];
    const result = parseArgs();
    expect(result.port).toBe(3000);
  });

  it('parses --cors and --trust-proxy', () => {
    process.argv = ['node', 'vitek-serve', '--cors', '--trust-proxy'];
    const result = parseArgs();
    expect(result.cors).toBe(true);
    expect(result.trustProxy).toBe(true);
  });

  it('parses --mode and --env', () => {
    process.argv = ['node', 'vitek-serve', '--mode', 'staging'];
    expect(parseArgs().mode).toBe('staging');
    process.argv = ['node', 'vitek-serve', '--mode=production'];
    expect(parseArgs().mode).toBe('production');
    process.argv = ['node', 'vitek-serve', '--env', 'test'];
    expect(parseArgs().mode).toBe('test');
    process.argv = ['node', 'vitek-serve', '--env=development'];
    expect(parseArgs().mode).toBe('development');
  });
});

describe('loadProductionConfig', () => {
  it('returns empty object when vitek.config.mjs does not exist', async () => {
    const result = await loadProductionConfig(path.join(__dirname, '..', '..', 'core'));
    expect(result).toEqual({});
  });

  it('loads beforeApiRequest and onError when vitek.config.mjs exists', async () => {
    const fixtureDir = path.join(__dirname, 'fixtures', 'serve-config');
    const result = await loadProductionConfig(fixtureDir);
    expect(result.beforeApiRequest).toBeDefined();
    expect(Array.isArray(result.beforeApiRequest)).toBe(true);
    expect(result.beforeApiRequest!.length).toBe(1);
    expect(typeof result.beforeApiRequest![0]).toBe('function');
    expect(result.onError).toBeDefined();
    expect(typeof result.onError).toBe('function');
  });

  it('loads onServerStart and onServerShutdown when vitek.config.mjs exports them', async () => {
    const fixtureDir = path.join(__dirname, 'fixtures', 'serve-config');
    const result = await loadProductionConfig(fixtureDir);
    expect(result.onServerStart).toBeDefined();
    expect(typeof result.onServerStart).toBe('function');
    expect(result.onServerShutdown).toBeDefined();
    expect(typeof result.onServerShutdown).toBe('function');
  });

  it('onServerStart receives context with api, sockets, server', async () => {
    const fixtureDir = path.join(__dirname, 'fixtures', 'serve-config');
    const result = await loadProductionConfig(fixtureDir);
    const mockCtx = {
      api: { fetch: async () => ({}) },
      sockets: { emit: () => {} },
      server: {} as import('http').Server,
    };
    delete (globalThis as Record<string, unknown>).__vitekOnServerStartCtx;
    delete (globalThis as Record<string, unknown>).__vitekOnServerStartCalled;
    result.onServerStart!(mockCtx);
    expect((globalThis as Record<string, unknown>).__vitekOnServerStartCalled).toBe(true);
    expect((globalThis as Record<string, unknown>).__vitekOnServerStartCtx).toEqual(mockCtx);
    delete (globalThis as Record<string, unknown>).__vitekOnServerStartCtx;
    delete (globalThis as Record<string, unknown>).__vitekOnServerStartCalled;
  });
});
