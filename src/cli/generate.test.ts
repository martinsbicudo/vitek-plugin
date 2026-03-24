import { describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runGenerate } from './generate.js';

describe('runGenerate', () => {
  it('generates prisma crud files', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-generate-'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    await runGenerate('crud', ['User', '--adapter', 'prisma', '--out', 'src/api/users', '--root', root]);
    expect(fs.existsSync(path.join(root, 'src/api/users/index.get.ts'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'src/api/users/[id].patch.ts'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'src/api/users/crud.contract.test.ts'))).toBe(true);
    expect(exitSpy).not.toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  });
});
