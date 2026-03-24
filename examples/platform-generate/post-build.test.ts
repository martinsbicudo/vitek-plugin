import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('platform-generate example', () => {
  it('codegen produced prisma CRUD routes', () => {
    const list = path.join(ROOT, 'src/api/genitems/index.get.ts');
    expect(fs.existsSync(list)).toBe(true);
    const src = fs.readFileSync(list, 'utf-8');
    expect(src).toContain('GenItem');
    expect(src).toContain('prisma');
  });

  it('dist bundle includes genitems routes', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
  });
});
