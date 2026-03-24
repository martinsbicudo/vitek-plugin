import { describe, it, expect } from 'vitest';
import issuesHandler from './src/api/issues.get';

describe('issues list', () => {
  it('returns issues array', async () => {
    const result = await issuesHandler({
      url: '',
      method: 'get',
      path: '/api/issues',
      query: {},
      params: {},
      headers: {},
    });
    expect(Array.isArray(result.issues)).toBe(true);
  });
});
