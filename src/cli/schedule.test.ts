import { describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runSchedule } from './schedule.js';

describe('runSchedule', () => {
  it('prints json result for valid schedule file', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-schedule-'));
    const file = path.join(root, 'vitek.schedule.mjs');
    fs.writeFileSync(
      file,
      'export default { tasks: [{ name: "cleanup", cron: "* * * * *", run: async () => {} }] };\n',
      'utf-8'
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    await runSchedule('run', ['--root', root, '--json']);
    expect(logSpy).toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalledWith(1);
    logSpy.mockRestore();
    exitSpy.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('exits with code 2 when file is missing', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-schedule-missing-'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    await runSchedule('run', ['--root', root, '--file', 'missing.mjs']);
    expect(exitSpy).toHaveBeenCalledWith(2);
    exitSpy.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  });
});
