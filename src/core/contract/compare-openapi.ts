import type { DriftIssue } from './types.js';
import { OPENAPI_PATH_METHODS } from './http-methods.js';
import { sortKeysDeep } from './sort-json.js';

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function getPaths(spec: unknown): Record<string, unknown> {
  return asRecord(asRecord(spec).paths);
}

function listOperations(paths: Record<string, unknown>): Array<{ openApiPath: string; method: string }> {
  const out: Array<{ openApiPath: string; method: string }> = [];
  for (const openApiPath of Object.keys(paths).sort()) {
    const item = asRecord(paths[openApiPath]);
    for (const method of Object.keys(item).sort()) {
      if (!OPENAPI_PATH_METHODS.has(method)) continue;
      out.push({ openApiPath, method });
    }
  }
  return out;
}

function opKey(openApiPath: string, method: string): string {
  return `${method.toUpperCase()} ${openApiPath}`;
}

function getResponses(operation: unknown): Record<string, unknown> {
  const op = asRecord(operation);
  return asRecord(op.responses);
}

function responseFingerprint(response: unknown): string {
  return JSON.stringify(sortKeysDeep(response));
}

export function compareOpenApiSpecs(baseline: unknown, current: unknown): DriftIssue[] {
  const issues: DriftIssue[] = [];
  const basePaths = getPaths(baseline);
  const curPaths = getPaths(current);

  for (const openApiPath of Object.keys(basePaths).sort()) {
    if (!curPaths[openApiPath]) {
      issues.push({
        severity: 'error',
        code: 'missing_path',
        message: `Path removed from contract: ${openApiPath}`,
      });
    }
  }

  for (const openApiPath of Object.keys(basePaths).sort()) {
    if (!curPaths[openApiPath]) continue;
    const baseItem = asRecord(basePaths[openApiPath]);
    const curItem = asRecord(curPaths[openApiPath]);
    for (const method of Object.keys(baseItem).sort()) {
      if (!OPENAPI_PATH_METHODS.has(method)) continue;
      if (curItem[method] == null) {
        issues.push({
          severity: 'error',
          code: 'missing_method',
          message: `Operation removed from contract: ${opKey(openApiPath, method)}`,
        });
      }
    }
  }

  const baseOps = listOperations(basePaths);
  const curOps = listOperations(curPaths);
  const baseSet = new Set(baseOps.map((o) => opKey(o.openApiPath, o.method)));

  for (const { openApiPath, method } of curOps) {
    const key = opKey(openApiPath, method);
    if (!baseSet.has(key)) {
      issues.push({
        severity: 'warning',
        code: 'undocumented_operation',
        message: `Operation not in baseline (new or undocumented in snapshot): ${key}`,
      });
    }
  }

  for (const { openApiPath, method } of baseOps) {
    if (!curPaths[openApiPath]) continue;
    const baseItem = asRecord(basePaths[openApiPath]);
    const curItem = asRecord(curPaths[openApiPath]);
    if (curItem[method] == null) continue;
    const baseOp = baseItem[method];
    const curOp = curItem[method];
    const baseResp = getResponses(baseOp);
    const curResp = getResponses(curOp);
    const statuses = new Set([...Object.keys(baseResp), ...Object.keys(curResp)]);

    for (const status of [...statuses].sort()) {
      if (baseResp[status] != null && curResp[status] == null) {
        issues.push({
          severity: 'error',
          code: 'missing_response_status',
          message: `Response ${status} missing for ${opKey(openApiPath, method)}`,
        });
      } else if (baseResp[status] == null && curResp[status] != null) {
        issues.push({
          severity: 'warning',
          code: 'new_response_status',
          message: `New response status ${status} for ${opKey(openApiPath, method)}`,
        });
      } else if (baseResp[status] != null && curResp[status] != null) {
        if (responseFingerprint(baseResp[status]) !== responseFingerprint(curResp[status])) {
          issues.push({
            severity: 'error',
            code: 'response_schema_mismatch',
            message: `Response ${status} schema mismatch for ${opKey(openApiPath, method)}`,
          });
        }
      }
    }
  }

  return issues;
}
