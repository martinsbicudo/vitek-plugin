import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerMcpWriteTools } from './mcp-project-write-tools.js';

type ToolHandler = (input: Record<string, unknown>) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError: boolean;
}>;

class MockServer {
  tools: Array<{ name: string; handler: ToolHandler }> = [];

  registerTool(name: string, _schema: unknown, handler: ToolHandler): void {
    this.tools.push({ name, handler });
  }
}

describe('registerMcpWriteTools', () => {
  it('registers tools in order and route_create handler returns dry-run result', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-mcp-reg-'));
    fs.mkdirSync(path.join(root, 'src', 'api'), { recursive: true });
    const server = new MockServer();
    registerMcpWriteTools(
      server as unknown as import('@modelcontextprotocol/sdk/server/mcp.js').McpServer,
      root,
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
    const create = server.tools.find((t) => t.name === 'vitek_route_create');
    expect(create).toBeDefined();
    const res = await create!.handler({ routePath: 'health', method: 'get' });
    expect(res.isError).toBe(false);
    const body = JSON.parse(res.content[0].text) as { ok: boolean; dryRun: boolean; diff: string };
    expect(body.ok).toBe(true);
    expect(body.dryRun).toBe(true);
    expect(body.diff).toContain('health.get.ts');
    fs.rmSync(root, { recursive: true, force: true });
  });
});
