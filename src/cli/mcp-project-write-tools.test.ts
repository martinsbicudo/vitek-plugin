import { describe, expect, it } from 'vitest';
import { registerMcpWriteTools } from './mcp-project-write-tools.js';

class MockServer {
  tools: Array<{ name: string }> = [];

  registerTool(name: string): void {
    this.tools.push({ name });
  }
}

describe('registerMcpWriteTools', () => {
  it('registers all write-safe tools', () => {
    const server = new MockServer();
    registerMcpWriteTools(
      server as unknown as import('@modelcontextprotocol/sdk/server/mcp.js').McpServer,
      '/tmp/project',
      {
        apiDir: 'src/api',
        apiBasePath: '/api',
        socketBasePath: '/api/ws',
        baseUrl: 'http://localhost:5173',
      }
    );
    expect(server.tools.map((t) => t.name)).toEqual([
      'vitek_route_create',
      'vitek_route_update',
      'vitek_validation_suggest',
      'vitek_test_generate',
      'vitek_openapi_sync',
    ]);
  });
});
