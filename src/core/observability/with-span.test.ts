import { describe, it, expect } from 'vitest';
import { withSpan } from './with-span.js';

describe('withSpan', () => {
  it('resolves async callback value', async () => {
    const v = await withSpan('t', async () => 42);
    expect(v).toBe(42);
  });

  it('resolves sync callback value', async () => {
    const v = await withSpan('t', () => 'x');
    expect(v).toBe('x');
  });

  it('span setAttribute is safe no-op', async () => {
    const v = await withSpan('t', async (span) => {
      span.setAttribute('k', 'v');
      return 1;
    });
    expect(v).toBe(1);
  });
});
