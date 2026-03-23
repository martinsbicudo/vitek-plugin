import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('build-api-false example', () => {
  it('dist exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
  });

  it('vitek-api.mjs is not produced', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(false);
  });

  it('resolves vitek-plugin subpath exports', async () => {
    const { vitek } = await import('vitek-plugin/plugin');
    expect(typeof vitek).toBe('function');
    const { ok } = await import('vitek-plugin/response');
    expect(typeof ok).toBe('function');
  });
});
