import { describe, it, expect } from 'vitest';
import { routesToSchema } from './schema.js';
import { patternToRegex } from '../normalize/normalize-path.js';
import type { Route } from '../routing/route-types.js';

describe('schema', () => {
  it('routesToSchema maps routes to schema', () => {
    const routes: Route[] = [
      { pattern: '/health', method: 'get', params: [], file: '/src/api/health.get.ts', handler: () => ({}), regex: patternToRegex('/health') },
      {
        pattern: '/users/[id]',
        method: 'get',
        params: ['id'],
        file: '/src/api/users/[id].get.ts',
        handler: () => ({}),
        regex: patternToRegex('/users/:id'),
        bodyType: 'UsersIdGetBody',
        queryType: 'UsersIdGetQuery',
      },
    ];
    const schema = routesToSchema(routes);
    expect(schema).toHaveLength(2);
    expect(schema[0]).toEqual({
      pattern: '/health',
      method: 'get',
      params: [],
      file: '/src/api/health.get.ts',
      bodyType: undefined,
      queryType: undefined,
    });
    expect(schema[1]).toEqual({
      pattern: '/users/[id]',
      method: 'get',
      params: ['id'],
      file: '/src/api/users/[id].get.ts',
      bodyType: 'UsersIdGetBody',
      queryType: 'UsersIdGetQuery',
    });
  });

  it('routesToSchema handles empty array', () => {
    expect(routesToSchema([])).toEqual([]);
  });
});
