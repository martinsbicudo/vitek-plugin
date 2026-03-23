import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { spawn } from 'child_process';
import { getManifest } from 'vitek-plugin/introspection';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('vitek-plugin build outputs (mcp-project)', () => {
  it('dist and bundles exist', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-sockets.mjs'))).toBe(true);
  });

  it('resolves mcp-related subpath exports', async () => {
    const introspection = await import('vitek-plugin/introspection');
    expect(typeof introspection.getManifest).toBe('function');
    const plugin = await import('vitek-plugin/plugin');
    expect(typeof plugin.vitek).toBe('function');
  });

  it('manifest includes route and socket from example', () => {
    const manifest = getManifest(ROOT, 'src/api');
    const hasRoute = manifest.routes.some((r) => r.pattern === 'health' && r.method === 'get');
    const hasSocket = manifest.sockets.some((s) => s.pattern === 'notify');
    expect(hasRoute).toBe(true);
    expect(hasSocket).toBe(true);
  });

  it('can load built api bundle and find health route', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const health = mod.routes.find((r) => r.pattern === 'health' && r.method === 'get');
    expect(health).toBeDefined();
  });

  it('vitek mcp command starts', async () => {
    const cliPath = path.join(ROOT, 'node_modules', 'vitek-plugin', 'dist', 'cli', 'cli.js');
    expect(fs.existsSync(cliPath)).toBe(true);

    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [cliPath, 'mcp'], {
        cwd: ROOT,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let settled = false;
      let stderr = '';
      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });
      child.on('exit', (code) => {
        if (settled) return;
        settled = true;
        if (code !== null && code !== 0) {
          reject(new Error(`mcp exited early with code ${code}: ${stderr}`));
          return;
        }
        resolve(undefined);
      });

      setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill('SIGTERM');
        resolve(undefined);
      }, 300);
    });
  });
});
