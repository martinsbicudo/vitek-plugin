import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('platform-doctor example', () => {
  it('dist and bundle exist', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
  });

  it('vitek doctor --json returns a valid report', () => {
    const out = execSync('pnpm exec vitek doctor --json', {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const report = JSON.parse(out.trim()) as {
      score: number;
      dimensions: Array<{ name: string; score: number; max: number }>;
      topActions: string[];
    };
    expect(typeof report.score).toBe('number');
    expect(report.dimensions.length).toBeGreaterThan(0);
    expect(Array.isArray(report.topActions)).toBe(true);
  });
});
