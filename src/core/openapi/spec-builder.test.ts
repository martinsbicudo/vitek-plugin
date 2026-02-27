import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { buildPaths, buildSchemas } from './spec-builder.js';
import type { RouteForDocs, OpenApiOptions } from './types.js';

function route(
  pattern: string,
  method: string,
  params: string[] = [],
  overrides: Partial<RouteForDocs> = {}
): RouteForDocs {
  return {
    pattern,
    method,
    params,
    file: '',
    ...overrides,
  };
}

describe('spec-builder', () => {
  let tmpDir: string;
  let routeFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'spec-builder-'));
    routeFile = path.join(tmpDir, 'health.get.ts');
    fs.writeFileSync(
      routeFile,
      '/**\n * @summary Health check\n */\nexport default function handler() { return {}; }\n',
      'utf-8'
    );
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {
      // ignore
    }
  });

  describe('buildPaths', () => {
    it('builds path item for GET route', () => {
      const routes = [route('health', 'get', [], { file: routeFile })];
      const paths = buildPaths(routes, {});
      expect(paths['/health']).toBeDefined();
      const item = paths['/health'] as Record<string, unknown>;
      expect(item.get).toBeDefined();
      const op = item.get as Record<string, unknown>;
      expect(op.operationId).toBe('getHealth');
      expect(op.summary).toBe('Health check');
    });

    it('converts :param to OpenAPI {param}', () => {
      const routes = [route('users/:id', 'get', ['id'], { file: routeFile })];
      const paths = buildPaths(routes, {});
      expect(paths['/users/{id}']).toBeDefined();
      const item = paths['/users/{id}'] as Record<string, unknown>;
      const op = item.get as Record<string, unknown>;
      expect(op.parameters).toEqual([
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: undefined },
      ]);
    });

    it('merges multiple methods on same path', () => {
      const routes = [
        route('users', 'get', [], { file: routeFile }),
        route('users', 'post', [], { file: routeFile }),
      ];
      const paths = buildPaths(routes, {});
      const item = paths['/users'] as Record<string, unknown>;
      expect(item.get).toBeDefined();
      expect(item.post).toBeDefined();
    });

    it('empty pattern becomes /', () => {
      const routes = [route('', 'get', [], { file: routeFile })];
      const paths = buildPaths(routes, {});
      expect(paths['/']).toBeDefined();
    });
  });

  describe('buildSchemas', () => {
    it('returns empty schemas when no body or query types', () => {
      const routes = [route('health', 'get', [], { file: routeFile })];
      expect(buildSchemas(routes)).toEqual({});
    });

    it('adds schema for body type reference', () => {
      const routes = [
        route('users', 'post', [], { file: routeFile, bodyType: 'CreateUser' }),
      ];
      const schemas = buildSchemas(routes);
      expect(schemas['CreateUser']).toEqual({
        type: 'object',
        description: 'CreateUser schema',
      });
    });

    it('adds schema for query type reference', () => {
      const routes = [
        route('users', 'get', [], { file: routeFile, queryType: 'ListQuery' }),
      ];
      const schemas = buildSchemas(routes);
      expect(schemas['ListQuery']).toEqual({
        type: 'object',
        description: 'ListQuery schema',
      });
    });
  });
});
