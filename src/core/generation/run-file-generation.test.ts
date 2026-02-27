import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parsedRoutesToSchema, runFileGeneration } from './run-file-generation.js';
import type { ParsedRoute } from '../routing/route-parser.js';
import type { ParsedSocket } from '../routing/socket-parser.js';

function parsedRoute(
  pattern: string,
  method: string,
  params: string[] = [],
  file?: string
): ParsedRoute {
  return {
    method: method as ParsedRoute['method'],
    pattern,
    params,
    file: file ?? `/api/${pattern.replace(/:/g, '[id]')}.${method}.ts`,
  };
}

function parsedSocket(pattern: string, params: string[] = []): ParsedSocket {
  return {
    pattern,
    params,
    file: `/api/${pattern.replace(/:/g, '[id]')}.socket.ts`,
  };
}

describe('parsedRoutesToSchema', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'run-file-gen-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {
      //
    }
  });

  it('returns schema with pattern, method, params', () => {
    const routeFile = path.join(tmpDir, 'health.get.ts');
    fs.writeFileSync(routeFile, 'export default function handler() {}', 'utf-8');
    const routes: ParsedRoute[] = [
      {
        method: 'get',
        pattern: 'health',
        params: [],
        file: routeFile,
      },
    ];
    const schema = parsedRoutesToSchema(routes);
    expect(schema).toHaveLength(1);
    expect(schema[0].pattern).toBe('health');
    expect(schema[0].method).toBe('get');
    expect(schema[0].params).toEqual([]);
  });

  it('extracts bodyType when route file exports Body', () => {
    const routeFile = path.join(tmpDir, 'users.post.ts');
    fs.writeFileSync(
      routeFile,
      `export type Body = { email: string; name?: string; };
export default function handler() {}`,
      'utf-8'
    );
    const routes: ParsedRoute[] = [
      {
        method: 'post',
        pattern: 'users',
        params: [],
        file: routeFile,
      },
    ];
    const schema = parsedRoutesToSchema(routes);
    expect(schema[0].bodyType).toBe('{ email: string; name?: string; }');
  });

  it('extracts queryType when route file exports Query', () => {
    const routeFile = path.join(tmpDir, 'posts.get.ts');
    fs.writeFileSync(
      routeFile,
      `export type Query = { limit?: number; };
export default function handler() {}`,
      'utf-8'
    );
    const routes: ParsedRoute[] = [
      {
        method: 'get',
        pattern: 'posts',
        params: [],
        file: routeFile,
      },
    ];
    const schema = parsedRoutesToSchema(routes);
    expect(schema[0].queryType).toBe('{ limit?: number; }');
  });
});

describe('runFileGeneration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'run-file-gen-test-'));
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {
      //
    }
  });

  it('generates api.types.ts and api.services.ts for TypeScript project', async () => {
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}', 'utf-8');
    const routeFile = path.join(tmpDir, 'src', 'api', 'health.get.ts');
    fs.mkdirSync(path.dirname(routeFile), { recursive: true });
    fs.writeFileSync(routeFile, 'export default function handler() {}', 'utf-8');

    const schema = parsedRoutesToSchema([
      { method: 'get', pattern: 'health', params: [], file: routeFile },
    ]);

    await runFileGeneration({
      root: tmpDir,
      schema,
      sockets: [],
      logger: {},
    });

    const typesPath = path.join(tmpDir, 'src', 'api.types.ts');
    const servicesPath = path.join(tmpDir, 'src', 'api.services.ts');
    expect(fs.existsSync(typesPath)).toBe(true);
    expect(fs.existsSync(servicesPath)).toBe(true);
    expect(fs.readFileSync(typesPath, 'utf-8')).toContain('VitekParams');
    expect(fs.readFileSync(servicesPath, 'utf-8')).toContain('getHealth');
  });

  it('generates api.services.js only for JavaScript project', async () => {
    const routeFile = path.join(tmpDir, 'src', 'api', 'health.get.js');
    fs.mkdirSync(path.dirname(routeFile), { recursive: true });
    fs.writeFileSync(routeFile, 'export default function handler() {}', 'utf-8');

    const schema = parsedRoutesToSchema([
      { method: 'get', pattern: 'health', params: [], file: routeFile },
    ]);

    await runFileGeneration({
      root: tmpDir,
      schema,
      sockets: [],
      logger: {},
    });

    expect(fs.existsSync(path.join(tmpDir, 'src', 'api.types.ts'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, 'src', 'api.services.js'))).toBe(true);
  });

  it('generates OpenAPI files when openApi is enabled', async () => {
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}', 'utf-8');
    fs.mkdirSync(path.join(tmpDir, 'public'), { recursive: true });
    const routeFile = path.join(tmpDir, 'src', 'api', 'health.get.ts');
    fs.mkdirSync(path.dirname(routeFile), { recursive: true });
    fs.writeFileSync(routeFile, 'export default function handler() {}', 'utf-8');

    const schema = parsedRoutesToSchema([
      { method: 'get', pattern: 'health', params: [], file: routeFile },
    ]);

    await runFileGeneration({
      root: tmpDir,
      schema,
      sockets: [],
      openApi: true,
      logger: {},
    });

    expect(fs.existsSync(path.join(tmpDir, 'public', 'openapi.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'public', 'api-docs.html'))).toBe(true);
  });
});
