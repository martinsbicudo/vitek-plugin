import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  generateOpenApiSpec,
  generateOpenApiFile,
  generateSwaggerUiHtml,
  generateApiDocsHtml,
} from './generate.js';
import type { RouteForDocs } from './generate.js';

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
    file: `/api/${pattern.replace(/:/g, '[id]')}.${method}.ts`,
    ...overrides,
  };
}

describe('generateOpenApiSpec', () => {
  it('returns valid OpenAPI 3.0 spec with empty routes', () => {
    const spec = generateOpenApiSpec([], {}) as Record<string, unknown>;
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info).toEqual({
      title: 'Vitek API',
      version: '1.0.0',
      description: 'Auto-generated API documentation',
    });
    expect(spec.paths).toEqual({});
    expect(spec.components).toBeDefined();
    expect((spec.components as Record<string, unknown>).schemas).toEqual({});
  });

  it('uses custom info when provided', () => {
    const spec = generateOpenApiSpec([], {
      info: {
        title: 'My API',
        version: '2.0.0',
        description: 'Custom description',
      },
    }) as Record<string, unknown>;
    expect(spec.info).toEqual({
      title: 'My API',
      version: '2.0.0',
      description: 'Custom description',
    });
  });

  it('adds servers when provided', () => {
    const spec = generateOpenApiSpec([], {
      servers: [{ url: 'https://api.example.com', description: 'Production' }],
    }) as Record<string, unknown>;
    expect(spec.servers).toEqual([
      { url: 'https://api.example.com', description: 'Production' },
    ]);
  });

  it('generates path for GET route without body or query', () => {
    const routes = [route('health', 'get')];
    const spec = generateOpenApiSpec(routes, {}) as Record<string, unknown>;
    const paths = spec.paths as Record<string, unknown>;
    expect(paths['/health']).toBeDefined();
    const pathItem = paths['/health'] as Record<string, unknown>;
    expect(pathItem.get).toBeDefined();
    const op = pathItem.get as Record<string, unknown>;
    expect(op.operationId).toBe('getHealth');
    expect(op.summary).toContain('health');
    expect(op.responses).toBeDefined();
    expect((op.responses as Record<string, unknown>)['200']).toBeDefined();
    expect((op.responses as Record<string, unknown>)['400']).toBeDefined();
  });

  it('converts pattern params to OpenAPI path format', () => {
    const routes = [route('users/:id', 'get', ['id'])];
    const spec = generateOpenApiSpec(routes, {}) as Record<string, unknown>;
    const paths = spec.paths as Record<string, unknown>;
    expect(paths['/users/{id}']).toBeDefined();
    const pathItem = paths['/users/{id}'] as Record<string, unknown>;
    expect(pathItem.get).toBeDefined();
    const op = pathItem.get as Record<string, unknown>;
    const params = op.parameters as Array<{ name: string; in: string }>;
    expect(params).toHaveLength(1);
    expect(params[0].name).toBe('id');
    expect(params[0].in).toBe('path');
  });

  it('adds requestBody for POST route with bodyType', () => {
    const routes = [
      route('users', 'post', [], { bodyType: '{ name: string; email: string }' }),
    ];
    const spec = generateOpenApiSpec(routes, {}) as Record<string, unknown>;
    const paths = spec.paths as Record<string, unknown>;
    const pathItem = paths['/users'] as Record<string, unknown>;
    const op = pathItem.post as Record<string, unknown>;
    expect(op.requestBody).toBeDefined();
    const body = op.requestBody as Record<string, unknown>;
    expect(body.required).toBe(true);
    expect((body.content as Record<string, unknown>)['application/json']).toBeDefined();
  });

  it('adds query parameters when queryType is present', () => {
    const routes = [
      route('users', 'get', [], { queryType: '{ limit?: number; offset?: number }' }),
    ];
    const spec = generateOpenApiSpec(routes, {}) as Record<string, unknown>;
    const paths = spec.paths as Record<string, unknown>;
    const pathItem = paths['/users'] as Record<string, unknown>;
    const op = pathItem.get as Record<string, unknown>;
    const params = op.parameters as Array<{ name: string; in: string }>;
    expect(params).toBeDefined();
    expect(params.some((p) => p.name === 'limit' && p.in === 'query')).toBe(true);
    expect(params.some((p) => p.name === 'offset' && p.in === 'query')).toBe(true);
  });

  it('generates multiple methods for same path', () => {
    const routes = [
      route('users/:id', 'get', ['id']),
      route('users/:id', 'put', ['id']),
      route('users/:id', 'delete', ['id']),
    ];
    const spec = generateOpenApiSpec(routes, {}) as Record<string, unknown>;
    const paths = spec.paths as Record<string, unknown>;
    const pathItem = paths['/users/{id}'] as Record<string, unknown>;
    expect(pathItem.get).toBeDefined();
    expect(pathItem.put).toBeDefined();
    expect(pathItem.delete).toBeDefined();
  });

  it('includes default error responses for all operations', () => {
    const routes = [route('health', 'get')];
    const spec = generateOpenApiSpec(routes, {}) as Record<string, unknown>;
    const paths = spec.paths as Record<string, unknown>;
    const op = (paths['/health'] as Record<string, unknown>).get as Record<string, unknown>;
    const responses = op.responses as Record<string, unknown>;
    expect(responses['400']).toBeDefined();
    expect(responses['401']).toBeDefined();
    expect(responses['404']).toBeDefined();
    expect(responses['500']).toBeDefined();
  });
});

describe('generateOpenApiFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'openapi-gen-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {
      //
    }
  });

  it('writes valid JSON spec to file', async () => {
    const outputPath = path.join(tmpDir, 'openapi.json');
    const routes = [route('health', 'get')];
    await generateOpenApiFile(outputPath, routes, {});
    expect(fs.existsSync(outputPath)).toBe(true);
    const content = fs.readFileSync(outputPath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.openapi).toBe('3.0.3');
    expect(parsed.paths['/health']).toBeDefined();
  });

  it('creates directory if it does not exist', async () => {
    const outputPath = path.join(tmpDir, 'nested', 'dir', 'openapi.json');
    await generateOpenApiFile(outputPath, [], {});
    expect(fs.existsSync(outputPath)).toBe(true);
  });
});

describe('generateSwaggerUiHtml', () => {
  it('returns HTML with title and api path', () => {
    const html = generateSwaggerUiHtml('/api/openapi.json', 'My API Docs');
    expect(html).toContain('<title>My API Docs</title>');
    expect(html).toContain("url: '/api/openapi.json'");
    expect(html).toContain('swagger-ui');
  });

  it('escapes HTML in title', () => {
    const html = generateSwaggerUiHtml('/api.json', '<script>alert(1)</script>');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('generateApiDocsHtml', () => {
  it('returns Swagger-only HTML when asyncApiJsonPath is not provided', () => {
    const html = generateApiDocsHtml('/openapi.json', 'API');
    expect(html).toContain('swagger-ui');
    expect(html).not.toContain('vitek-docs-tabs');
  });

  it('returns combined REST + WebSockets HTML when asyncApiJsonPath is provided', () => {
    const html = generateApiDocsHtml('/openapi.json', 'API', {
      asyncApiJsonPath: '/asyncapi.json',
    });
    expect(html).toContain('vitek-docs-tabs');
    expect(html).toContain('data-tab="rest"');
    expect(html).toContain('data-tab="websockets"');
    expect(html).toContain('/asyncapi.json');
  });
});
