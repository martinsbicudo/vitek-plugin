import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { buildApiBundle, getApiBundleFilename } from './build-api-bundle.js';

describe('build-api-bundle', () => {
  let rootDir: string;
  let apiDir: string;
  let outDir: string;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(process.cwd(), 'build-api-test-'));
    apiDir = path.join(rootDir, 'src', 'api');
    outDir = path.join(rootDir, 'dist');
    fs.mkdirSync(apiDir, { recursive: true });
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(apiDir, 'health.get.ts'),
      'export default function handler() { return { ok: true }; }\n',
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

  it('getApiBundleFilename returns vitek-api.mjs', () => {
    expect(getApiBundleFilename()).toBe('vitek-api.mjs');
  });

  it('returns null when apiDir does not exist', async () => {
    const result = await buildApiBundle({
      root: rootDir,
      apiDir: path.join(rootDir, 'nonexistent'),
      outDir,
    });
    expect(result).toBeNull();
  });

  it('returns null when apiDir has no routes', async () => {
    fs.unlinkSync(path.join(apiDir, 'health.get.ts'));
    const result = await buildApiBundle({ root: rootDir, apiDir, outDir });
    expect(result).toBeNull();
  });

  it('builds vitek-api.mjs when apiDir has routes', async () => {
    const result = await buildApiBundle({ root: rootDir, apiDir, outDir });
    expect(result).toBe(path.join(outDir, 'vitek-api.mjs'));
    expect(fs.existsSync(result!)).toBe(true);
    const content = fs.readFileSync(result!, 'utf-8');
    expect(content).toContain('routes');
    expect(content).toContain('middlewares');
    expect(content).toContain('export');
  });
});
