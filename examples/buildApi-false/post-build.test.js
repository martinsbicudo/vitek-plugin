import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('buildApi-false example', () => {
  it('dist exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
  });

  it('vitek-api.mjs is not produced', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(false);
  });
});
