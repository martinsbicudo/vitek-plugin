import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('platform-schedule example', () => {
  it('dist and bundle exist', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
  });

  it('vitek schedule run completes demo task', () => {
    const out = execSync('pnpm exec vitek schedule run --json', {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const result = JSON.parse(out.trim()) as { tasks: Array<{ name: string; ok: boolean }> };
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].name).toBe('demo-task');
    expect(result.tasks[0].ok).toBe(true);
  });
});
