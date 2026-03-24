import type { DriftIssue } from './types.js';
import { sortKeysDeep } from './sort-json.js';

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function getChannels(spec: unknown): Record<string, unknown> {
  return asRecord(asRecord(spec).channels);
}

function channelFingerprint(channel: unknown): string {
  return JSON.stringify(sortKeysDeep(channel));
}

export function compareAsyncApiSpecs(baseline: unknown, current: unknown): DriftIssue[] {
  const issues: DriftIssue[] = [];
  const baseCh = getChannels(baseline);
  const curCh = getChannels(current);
  const keys = new Set([...Object.keys(baseCh), ...Object.keys(curCh)]);

  for (const k of [...keys].sort()) {
    if (baseCh[k] != null && curCh[k] == null) {
      issues.push({
        severity: 'error',
        code: 'asyncapi_missing_channel',
        message: `WebSocket channel removed from contract: ${k}`,
      });
    } else if (baseCh[k] == null && curCh[k] != null) {
      issues.push({
        severity: 'warning',
        code: 'asyncapi_new_channel',
        message: `WebSocket channel not in baseline: ${k}`,
      });
    } else if (baseCh[k] != null && curCh[k] != null) {
      if (channelFingerprint(baseCh[k]) !== channelFingerprint(curCh[k])) {
        issues.push({
          severity: 'error',
          code: 'asyncapi_channel_mismatch',
          message: `WebSocket channel definition drift: ${k}`,
        });
      }
    }
  }

  return issues;
}
