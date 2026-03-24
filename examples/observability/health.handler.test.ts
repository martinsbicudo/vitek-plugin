import { describe, it, expect } from 'vitest';
import { createMockContext } from 'vitek-plugin/testing';
import handler from './src/api/health.get';

describe('health handler', () => {
  it('returns ok and requestId when present', async () => {
    const ctx = createMockContext({ requestId: 'test-rid' });
    const result = await handler(ctx);
    expect(result).toEqual({ status: 'ok', requestId: 'test-rid' });
  });
});
