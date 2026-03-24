import { loadPlatformConfig, isFeatureEnabled } from '../../platform/config.js';

export interface ApplyResolution {
  dryRun: boolean;
  writeAllowed: boolean;
  rejectReason?: string;
}

export function resolveApplyMode(root: string, apply: boolean, dryRun: boolean): ApplyResolution {
  if (!apply) {
    return { dryRun: true, writeAllowed: false };
  }
  if (dryRun) {
    return {
      dryRun: true,
      writeAllowed: false,
      rejectReason: 'Pass dryRun: false together with apply: true to confirm writing to disk.',
    };
  }
  const cfg = loadPlatformConfig(root);
  if (!isFeatureEnabled(cfg, 'mcpWriteTools')) {
    return {
      dryRun: true,
      writeAllowed: false,
      rejectReason:
        'Set features.mcpWriteTools: true in vitek.platform.json, then call with apply: true and dryRun: false.',
    };
  }
  return { dryRun: false, writeAllowed: true };
}
