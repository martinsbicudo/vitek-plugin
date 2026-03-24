import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { REDACTED_VALUE } from '../platform/redaction.js';
import { runDoctor } from './doctor.js';

describe('runDoctor', () => {
  it('prints parseable doctor report json with expected shape', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-doctor-cli-'));
    fs.writeFileSync(path.join(root, 'docs.md'), 'x', 'utf-8');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runDoctor(['--root', root, '--json']);
    expect(logSpy).toHaveBeenCalledTimes(1);
    const raw = logSpy.mock.calls[0][0] as string;
    const report = JSON.parse(raw) as {
      score: number;
      dimensions: Array<{ name: string; score: number; max: number; notes: string[] }>;
      topActions: string[];
    };
    expect(typeof report.score).toBe('number');
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(report.dimensions)).toBe(true);
    expect(report.dimensions.length).toBeGreaterThan(0);
    for (const d of report.dimensions) {
      expect(typeof d.name).toBe('string');
      expect(d.name.length).toBeGreaterThan(0);
      expect(typeof d.score).toBe('number');
      expect(typeof d.max).toBe('number');
      expect(d.max).toBeGreaterThan(0);
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(d.max);
      expect(Array.isArray(d.notes)).toBe(true);
    }
    expect(Array.isArray(report.topActions)).toBe(true);
    logSpy.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('writes local-only AI payload with redacted score field', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-doctor-ai-'));
    fs.writeFileSync(
      path.join(root, 'vitek.platform.json'),
      JSON.stringify({
        ai: {
          enabled: true,
          mode: 'local-only',
          provider: 'openai',
          model: 'gpt-4.1-mini',
          redaction: { stripHeaders: ['authorization'], stripFields: ['score'] },
        },
      }),
      'utf-8'
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runDoctor(['--root', root, '--json', '--ai-analyze']);
    const outPath = path.join(root, '.vitek/doctor/ai-input.redacted.json');
    expect(fs.existsSync(outPath)).toBe(true);
    const payload = JSON.parse(fs.readFileSync(outPath, 'utf-8')) as {
      score: string;
      dimensions: unknown;
      topActions: unknown;
      project: string;
    };
    expect(payload.score).toBe(REDACTED_VALUE);
    expect(Array.isArray(payload.dimensions)).toBe(true);
    expect(Array.isArray(payload.topActions)).toBe(true);
    expect(typeof payload.project).toBe('string');
    logSpy.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('skips AI analyze when ai disabled and does not write payload file', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-doctor-ai-skip-'));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runDoctor(['--root', root, '--json', '--ai-analyze']);
    expect(logSpy.mock.calls.some((c) => String(c[0]).includes('AI analyze skipped'))).toBe(true);
    expect(fs.existsSync(path.join(root, '.vitek/doctor/ai-input.redacted.json'))).toBe(false);
    logSpy.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  });
});
