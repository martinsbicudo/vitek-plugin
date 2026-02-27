import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createConfigPlugin } from './vitek-config.js';
import { createPluginContext } from './context.js';

describe('vitek:config', () => {
  it('config hook merges optimizeDeps.exclude with vitek-plugin', () => {
    const ctx = createPluginContext({}, 'src/api', true);
    const plugin = createConfigPlugin(ctx);
    const configFn = plugin.config;
    if (!configFn || typeof configFn !== 'function') {
      throw new Error('config hook not found');
    }
    const result = configFn({ root: process.cwd(), optimizeDeps: {} }, { command: 'build', mode: 'production' });
    expect(result).toBeDefined();
    expect((result as { optimizeDeps?: { exclude?: string[] } }).optimizeDeps?.exclude).toContain('vitek-plugin');
  });

  it('config hook preserves existing optimizeDeps.exclude', () => {
    const ctx = createPluginContext({}, 'src/api', true);
    const plugin = createConfigPlugin(ctx);
    const configFn = plugin.config;
    if (!configFn || typeof configFn !== 'function') return;
    const result = configFn(
      { root: process.cwd(), optimizeDeps: { exclude: ['some-pkg'] } },
      { command: 'build', mode: 'production' }
    ) as { optimizeDeps?: { exclude?: string[] } };
    expect(result.optimizeDeps?.exclude).toContain('some-pkg');
    expect(result.optimizeDeps?.exclude).toContain('vitek-plugin');
  });

  it('config hook merges alias when options.alias is set', () => {
    const root = fs.mkdtempSync(path.join(process.cwd(), 'vitek-config-test-'));
    try {
      const ctx = createPluginContext({ alias: { '@lib': 'src/lib' } }, 'src/api', true);
      const plugin = createConfigPlugin(ctx);
      const configFn = plugin.config;
      if (!configFn || typeof configFn !== 'function') return;
      const result = configFn({ root }, { command: 'build', mode: 'production' }) as {
        optimizeDeps?: unknown;
        resolve?: { alias?: Array<{ find: string; replacement: string }> };
      };
      expect(result.resolve?.alias).toBeDefined();
      const entries = result.resolve!.alias!;
      expect(Array.isArray(entries)).toBe(true);
      const our = entries.find((e) => e.find === '@lib');
      expect(our).toBeDefined();
      expect(our!.replacement).toContain('src/lib');
    } finally {
      try {
        fs.rmSync(root, { recursive: true });
      } catch {
        // ignore
      }
    }
  });

  it('config hook does not touch resolve when options.alias is empty', () => {
    const ctx = createPluginContext({}, 'src/api', true);
    const plugin = createConfigPlugin(ctx);
    const configFn = plugin.config;
    if (!configFn || typeof configFn !== 'function') return;
    const result = configFn(
      { root: process.cwd(), resolve: {} },
      { command: 'build', mode: 'production' }
    ) as { resolve?: unknown };
    expect(result.resolve).toBeUndefined();
  });
});
