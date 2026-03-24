import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { runDoctor } from './doctor.js';

describe('runDoctor', () => {
  it('prints json output', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-doctor-cli-'));
    fs.writeFileSync(path.join(root, 'docs.md'), 'x', 'utf-8');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runDoctor(['--root', root, '--json']);
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('writes local-only AI redacted payload', async () => {
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
    await runDoctor(['--root', root, '--ai-analyze']);
    expect(fs.existsSync(path.join(root, '.vitek/doctor/ai-input.redacted.json'))).toBe(true);
    logSpy.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  });
});
