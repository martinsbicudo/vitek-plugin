import type { RedactionPolicy } from './config.js';

const REDACTED_VALUE = '[REDACTED]';

function normalizeSet(values: string[]): Set<string> {
  return new Set(values.map((v) => v.toLowerCase()));
}

export function redactHeaders(
  headers: Record<string, string | string[] | undefined>,
  policy: RedactionPolicy
): Record<string, string | string[] | undefined> {
  const blocked = normalizeSet(policy.stripHeaders);
  const out: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (blocked.has(key.toLowerCase())) {
      out[key] = REDACTED_VALUE;
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function redactObject<T>(input: T, policy: RedactionPolicy): T {
  const blocked = normalizeSet(policy.stripFields);

  function walk(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(walk);
    }
    if (value !== null && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        if (blocked.has(key.toLowerCase())) {
          out[key] = REDACTED_VALUE;
        } else {
          out[key] = walk(child);
        }
      }
      return out;
    }
    return value;
  }

  return walk(input) as T;
}

export { REDACTED_VALUE };
