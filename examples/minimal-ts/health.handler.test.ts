import { describe, it, expect } from 'vitest';
import { createMockContext } from 'vitek-plugin/testing';
import handler from './src/api/health.get';

describe('health handler', () => {
  it('returns ok payload', async () => {
    const ctx = createMockContext();
    const result = await handler(ctx);
    expect(result).toEqual({ status: 'ok', ts: true });
  });
});
