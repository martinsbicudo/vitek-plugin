import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { buildDoctorReport } from './report.js';
import { DEFAULT_PLATFORM_CONFIG } from '../../platform/config.js';

describe('buildDoctorReport', () => {
  it('returns deterministic score and dimensions', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-doctor-'));
    fs.mkdirSync(path.join(root, 'docs/guide'), { recursive: true });
    fs.mkdirSync(path.join(root, '.vitek/contract'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs/ROADMAP-AI-PLATFORM.md'), '# roadmap\n', 'utf-8');
    fs.writeFileSync(path.join(root, 'docs/guide/contract.md'), '# contract\n', 'utf-8');
    fs.writeFileSync(path.join(root, '.vitek/contract/openapi.snapshot.json'), '{}', 'utf-8');
    fs.writeFileSync(path.join(root, 'src.test.ts'), 'import { it } from "vitest"; it("x", () => {});', 'utf-8');
    const report = buildDoctorReport(root, DEFAULT_PLATFORM_CONFIG);
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.dimensions.length).toBe(7);
    fs.rmSync(root, { recursive: true, force: true });
  });
});
