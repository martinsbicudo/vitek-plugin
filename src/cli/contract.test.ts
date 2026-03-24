import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { runContract, runContractCheck, runContractSnapshot } from './contract.js';

describe('contract CLI', () => {
  it('snapshot writes openapi snapshot and check reports no drift', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-contract-cli-'));
    const apiDir = path.join(root, 'src', 'api');
    fs.mkdirSync(apiDir, { recursive: true });
    fs.writeFileSync(
      path.join(apiDir, 'health.get.ts'),
      'export default function handler() { return { ok: true }; }\n',
      'utf-8'
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    await runContractSnapshot([`--root=${root}`]);
    const openApiPath = path.join(root, '.vitek', 'contract', 'openapi.snapshot.json');
    expect(fs.existsSync(openApiPath)).toBe(true);
    await runContractCheck([`--root=${root}`]);
    expect(exitSpy).not.toHaveBeenCalled();
    const logCalls = logSpy.mock.calls.map((c) => String(c[0]));
    expect(logCalls.some((line) => line.includes('No drift'))).toBe(true);
    logSpy.mockRestore();
    errSpy.mockRestore();
    exitSpy.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('check exits 1 when baseline has path not present in current spec', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-contract-drift-'));
    const apiDir = path.join(root, 'src', 'api');
    fs.mkdirSync(apiDir, { recursive: true });
    fs.writeFileSync(
      path.join(apiDir, 'health.get.ts'),
      'export default function handler() { return { ok: true }; }\n',
      'utf-8'
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runContractSnapshot([`--root=${root}`]);
    const openApiPath = path.join(root, '.vitek', 'contract', 'openapi.snapshot.json');
    const spec = JSON.parse(fs.readFileSync(openApiPath, 'utf-8')) as {
      paths: Record<string, unknown>;
    };
    spec.paths = spec.paths ?? {};
    spec.paths['/__phantom_baseline_only'] = {
      get: { responses: { '200': { description: 'only in baseline' } } },
    };
    fs.writeFileSync(openApiPath, JSON.stringify(spec, null, 2), 'utf-8');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code ?? 0}`);
    }) as (code?: number) => never);
    await expect(runContractCheck([`--root=${root}`])).rejects.toThrow('exit:1');
    expect(logSpy.mock.calls.some((c) => String(c[0]).toLowerCase().includes('error'))).toBe(true);
    logSpy.mockRestore();
    exitSpy.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('check exits 2 when openapi snapshot missing', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-contract-miss-'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code ?? 0}`);
    }) as (code?: number) => never);
    await expect(runContractCheck([`--root=${root}`])).rejects.toThrow('exit:2');
    expect(exitSpy).toHaveBeenCalledWith(2);
    errSpy.mockRestore();
    exitSpy.mockRestore();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('runContract prints usage when subcommand missing', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code ?? 0}`);
    }) as (code?: number) => never);
    await expect(runContract(undefined, [])).rejects.toThrow('exit:1');
    expect(exitSpy).toHaveBeenCalledWith(1);
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
