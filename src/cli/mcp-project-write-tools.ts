import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { VitekMcpConfig } from './mcp-project-config.js';
import {
  handleVitekOpenapiSync,
  handleVitekRouteCreate,
  handleVitekRouteUpdate,
  handleVitekTestGenerate,
  handleVitekValidationSuggest,
  type McpWriteToolResult,
} from '../mcp/write/project-write-handlers.js';

function respond(r: McpWriteToolResult) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(r, null, 2) }],
    isError: !r.ok,
  };
}

export function registerMcpWriteTools(server: McpServer, root: string, config: VitekMcpConfig): void {
  const ctx = {
    root,
    apiDir: config.apiDir,
    apiBasePath: config.apiBasePath,
    baseUrl: config.baseUrl,
  };

  server.registerTool(
    'vitek_route_create',
    {
      title: 'Create Vitek route (write-safe)',
      description:
        'Dry-run by default: returns unified diff and risk hints. Writes only with apply:true, dryRun:false, and vitek.platform.json features.mcpWriteTools:true.',
      inputSchema: {
        routePath: z.string().describe('Logical path, e.g. health or users/[id] or users/:id'),
        method: z.enum(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']),
        extension: z.enum(['ts', 'js']).optional().default('ts'),
        dryRun: z.boolean().optional().default(true),
        apply: z.boolean().optional().default(false),
      },
    },
    async (input) => respond(handleVitekRouteCreate(ctx, input))
  );

  server.registerTool(
    'vitek_route_update',
    {
      title: 'Replace Vitek route file (write-safe)',
      description:
        'Overwrites an existing route file. Dry-run by default; same apply rules as vitek_route_create.',
      inputSchema: {
        filePath: z.string().describe('Path relative to project root, e.g. src/api/health.get.ts'),
        content: z.string().describe('Full new file content'),
        dryRun: z.boolean().optional().default(true),
        apply: z.boolean().optional().default(false),
      },
    },
    async (input) => respond(handleVitekRouteUpdate(ctx, input))
  );

  server.registerTool(
    'vitek_validation_suggest',
    {
      title: 'Suggest validateBody scaffold (write-safe)',
      description:
        'Proposes import + validateBody(context.body, {}). Dry-run by default; same apply rules.',
      inputSchema: {
        filePath: z.string().describe('Route file path relative to project root'),
        dryRun: z.boolean().optional().default(true),
        apply: z.boolean().optional().default(false),
      },
    },
    async (input) => respond(handleVitekValidationSuggest(ctx, input))
  );

  server.registerTool(
    'vitek_test_generate',
    {
      title: 'Generate Vitest fetch test for route (write-safe)',
      description:
        'Creates colocated *.test.ts next to the route. Dry-run by default; same apply rules.',
      inputSchema: {
        routeFilePath: z.string().describe('Route file path relative to project root'),
        dryRun: z.boolean().optional().default(true),
        apply: z.boolean().optional().default(false),
      },
    },
    async (input) => respond(handleVitekTestGenerate(ctx, input))
  );

  server.registerTool(
    'vitek_openapi_sync',
    {
      title: 'Sync JSDoc @summary for OpenAPI (write-safe)',
      description:
        'Sets @summary from manifest (METHOD pattern). Dry-run by default; same apply rules.',
      inputSchema: {
        filePath: z.string().describe('Route file path relative to project root'),
        dryRun: z.boolean().optional().default(true),
        apply: z.boolean().optional().default(false),
      },
    },
    async (input) => respond(handleVitekOpenapiSync(ctx, input))
  );
}
