import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type LastServer = {
  resources: Array<{ name: string; uri: string; handler: () => Promise<{ contents: Array<{ uri: string; text: string }> }> }>;
  tools: Array<{ name: string; handler: (input: { method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options'; path: string; body?: unknown; headers?: Record<string, string> }) => Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> }>;
  connected: boolean;
} | null;

let lastServer: LastServer = null;
const loadMcpConfigMock = vi.fn();
const getManifestMock = vi.fn();
const generateOpenApiSpecMock = vi.fn();
const generateAsyncApiSpecMock = vi.fn();

async function loadSubject() {
  vi.resetModules();
  lastServer = null;

  class MockMcpServer {
    resources: Array<{ name: string; uri: string; handler: () => Promise<{ contents: Array<{ uri: string; text: string }> }> }> = [];
    tools: Array<{ name: string; handler: (input: { method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options'; path: string; body?: unknown; headers?: Record<string, string> }) => Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> }> = [];
    connected = false;

    constructor() {
      lastServer = this;
    }

    registerResource(name: string, uri: string, _meta: unknown, handler: () => Promise<{ contents: Array<{ uri: string; text: string }> }>) {
      this.resources.push({ name, uri, handler });
    }

    registerTool(name: string, _meta: unknown, handler: (input: { method: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options'; path: string; body?: unknown; headers?: Record<string, string> }) => Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }>) {
      this.tools.push({ name, handler });
    }

    async connect(_transport: unknown) {
      this.connected = true;
    }
  }

  class MockStdioServerTransport {}

  vi.doMock('@modelcontextprotocol/sdk/server/mcp.js', () => ({ McpServer: MockMcpServer }));
  vi.doMock('@modelcontextprotocol/sdk/server/stdio.js', () => ({ StdioServerTransport: MockStdioServerTransport }));
  vi.doMock('./mcp-project-config.js', () => ({ loadMcpConfig: loadMcpConfigMock }));
  vi.doMock('../core/introspection/manifest.js', () => ({ getManifest: getManifestMock }));
  vi.doMock('../core/openapi/generate.js', () => ({ generateOpenApiSpec: generateOpenApiSpecMock }));
  vi.doMock('../core/asyncapi/generate.js', () => ({ generateAsyncApiSpec: generateAsyncApiSpecMock }));

  const mod = await import('./mcp-project.js');
  return mod.runMcpProject;
}

describe('runMcpProject', () => {
  beforeEach(() => {
    loadMcpConfigMock.mockReset();
    getManifestMock.mockReset();
    generateOpenApiSpecMock.mockReset();
    generateAsyncApiSpecMock.mockReset();
    loadMcpConfigMock.mockReturnValue({
      apiDir: 'src/api',
      apiBasePath: '/api',
      socketBasePath: '/api/ws',
      baseUrl: 'http://localhost:5173',
    });
    getManifestMock.mockReturnValue({
      routes: [{ pattern: 'health', method: 'get', params: [], file: 'src/api/health.get.ts' }],
      middlewares: [],
      sockets: [{ pattern: 'notify', params: [], file: 'src/api/notify.socket.ts' }],
    });
    generateOpenApiSpecMock.mockReturnValue({ openapi: '3.0.3', paths: {} });
    generateAsyncApiSpecMock.mockReturnValue({ asyncapi: '2.4.0', channels: {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers resources and tool, then connects transport', async () => {
    const runMcpProject = await loadSubject();
    await runMcpProject();
    expect(lastServer).not.toBeNull();
    expect(lastServer?.resources.map((r) => r.uri)).toEqual([
      'vitek-api://manifest',
      'vitek-api://routes',
      'vitek-api://sockets',
      'vitek-api://openapi',
      'vitek-api://asyncapi',
    ]);
    expect(lastServer?.tools.map((t) => t.name)).toEqual(['vitek_api_call']);
    expect(lastServer?.connected).toBe(true);
  });

  it('returns manifest/routes/sockets resources with JSON payload', async () => {
    const runMcpProject = await loadSubject();
    await runMcpProject();
    const manifestResource = lastServer?.resources.find((r) => r.uri === 'vitek-api://manifest');
    const routesResource = lastServer?.resources.find((r) => r.uri === 'vitek-api://routes');
    const socketsResource = lastServer?.resources.find((r) => r.uri === 'vitek-api://sockets');
    expect(manifestResource).toBeDefined();
    expect(routesResource).toBeDefined();
    expect(socketsResource).toBeDefined();

    const manifestResponse = await manifestResource!.handler();
    const routesResponse = await routesResource!.handler();
    const socketsResponse = await socketsResource!.handler();
    expect(manifestResponse.contents[0].uri).toBe('vitek-api://manifest');
    expect(routesResponse.contents[0].uri).toBe('vitek-api://routes');
    expect(socketsResponse.contents[0].uri).toBe('vitek-api://sockets');
    expect(manifestResponse.contents[0].text).toContain('"pattern": "health"');
    expect(routesResponse.contents[0].text).toContain('"method": "get"');
    expect(socketsResponse.contents[0].text).toContain('"pattern": "notify"');
  });

  it('vitek_api_call tool returns success response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      })
    );
    const runMcpProject = await loadSubject();
    await runMcpProject();
    const tool = lastServer?.tools.find((t) => t.name === 'vitek_api_call');
    expect(tool).toBeDefined();
    const result = await tool!.handler({ method: 'get', path: 'health' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Status: 200');
    expect(result.content[0].text).toContain('"ok": true');
  });

  it('vitek_api_call tool returns error response when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down'))
    );
    const runMcpProject = await loadSubject();
    await runMcpProject();
    const tool = lastServer?.tools.find((t) => t.name === 'vitek_api_call');
    expect(tool).toBeDefined();
    const result = await tool!.handler({ method: 'get', path: 'health' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Request failed.');
    expect(result.content[0].text).toContain('network down');
  });
});
