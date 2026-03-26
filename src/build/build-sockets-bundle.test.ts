import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { buildSocketsBundle, getSocketsBundleFilename } from './build-sockets-bundle.js';

describe('build-sockets-bundle', () => {
  let rootDir: string;
  let apiDir: string;
  let outDir: string;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(process.cwd(), 'build-sockets-test-'));
    apiDir = path.join(rootDir, 'src', 'api');
    outDir = path.join(rootDir, 'dist');
    fs.mkdirSync(apiDir, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(apiDir, 'chat.socket.ts'),
      'export default function handler() {}\n',
      'utf-8'
    );
  });

  afterEach(() => {
    try {
      fs.rmSync(rootDir, { recursive: true });
    } catch {
      // ignore
    }
  });

  it('getSocketsBundleFilename returns vitek-sockets.mjs', () => {
    expect(getSocketsBundleFilename()).toBe('vitek-sockets.mjs');
  });

  it('returns null when apiDir does not exist', async () => {
    const result = await buildSocketsBundle({
      root: rootDir,
      apiDir: path.join(rootDir, 'nonexistent'),
      outDir,
    });
    expect(result).toBeNull();
  });

  it('returns null when apiDir has no socket files', async () => {
    fs.unlinkSync(path.join(apiDir, 'chat.socket.ts'));
    const result = await buildSocketsBundle({ root: rootDir, apiDir, outDir });
    expect(result).toBeNull();
  });

  it('builds vitek-sockets.mjs when apiDir has socket files', async () => {
    const result = await buildSocketsBundle({ root: rootDir, apiDir, outDir });
    expect(result).toBe(path.join(outDir, 'vitek-sockets.mjs'));
    expect(fs.existsSync(result!)).toBe(true);
    const content = fs.readFileSync(result!, 'utf-8');
    expect(content).toContain('sockets');
    expect(content).toContain('export');
    await expect(import(pathToFileURL(result!).href)).resolves.toBeDefined();
  });
});
