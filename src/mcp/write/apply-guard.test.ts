import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { resolveApplyMode } from './apply-guard.js';

function mkRoot(withWriteEnabled: boolean): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-mcp-guard-'));
  if (withWriteEnabled) {
    fs.writeFileSync(
      path.join(root, 'vitek.platform.json'),
      JSON.stringify({ features: { mcpWriteTools: true } }, null, 2),
      'utf-8'
    );
  }
  return root;
}

describe('resolveApplyMode', () => {
  it('stays dry-run when apply is false', () => {
    const root = mkRoot(true);
    const r = resolveApplyMode(root, false, true);
    expect(r.dryRun).toBe(true);
    expect(r.writeAllowed).toBe(false);
  });

  it('rejects apply true with dryRun true', () => {
    const root = mkRoot(true);
    const r = resolveApplyMode(root, true, true);
    expect(r.writeAllowed).toBe(false);
    expect(r.rejectReason).toContain('dryRun: false');
  });

  it('rejects write when feature flag disabled', () => {
    const root = mkRoot(false);
    const r = resolveApplyMode(root, true, false);
    expect(r.writeAllowed).toBe(false);
    expect(r.rejectReason).toContain('mcpWriteTools');
  });

  it('allows write when apply true, dryRun false, flag enabled', () => {
    const root = mkRoot(true);
    const r = resolveApplyMode(root, true, false);
    expect(r.writeAllowed).toBe(true);
    expect(r.dryRun).toBe(false);
  });
});
