import * as path from 'path';
import { getManifest } from '../core/introspection/manifest.js';
import { generateOpenApiSpec } from '../core/openapi/generate.js';
import { generateAsyncApiSpec } from '../core/asyncapi/generate.js';
import type { RouteForDocs } from '../core/openapi/types.js';
import { loadMcpConfig } from './mcp-project-config.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const MANIFEST_URI = 'vitek-api://manifest';
const ROUTES_URI = 'vitek-api://routes';
const SOCKETS_URI = 'vitek-api://sockets';
const OPENAPI_URI = 'vitek-api://openapi';
const ASYNCAPI_URI = 'vitek-api://asyncapi';

export async function runMcpProject(): Promise<void> {
  const root = process.cwd();
  const config = loadMcpConfig(root);

  const server = new McpServer(
    { name: 'vitek-api', version: '0.1.0' },
    { capabilities: { resources: {}, tools: {} } }
  );

  function getManifestData() {
    return getManifest(root, config.apiDir);
  }

  server.registerResource(
    'vitek-api-manifest',
    MANIFEST_URI,
    { title: 'Vitek API manifest', description: 'Full manifest (routes, middlewares, sockets)', mimeType: 'application/json' },
    async () => {
      const manifest = getManifestData();
      return { contents: [{ uri: MANIFEST_URI, text: JSON.stringify(manifest, null, 2) }] };
    }
  );

  server.registerResource(
    'vitek-api-routes',
    ROUTES_URI,
    { title: 'Vitek API routes', description: 'List of HTTP routes', mimeType: 'application/json' },
    async () => {
      const manifest = getManifestData();
      return { contents: [{ uri: ROUTES_URI, text: JSON.stringify(manifest.routes, null, 2) }] };
    }
  );

  server.registerResource(
    'vitek-api-sockets',
    SOCKETS_URI,
    { title: 'Vitek API sockets', description: 'List of WebSocket routes', mimeType: 'application/json' },
    async () => {
      const manifest = getManifestData();
      return { contents: [{ uri: SOCKETS_URI, text: JSON.stringify(manifest.sockets, null, 2) }] };
    }
  );

  server.registerResource(
    'vitek-api-openapi',
    OPENAPI_URI,
    { title: 'OpenAPI spec', description: 'OpenAPI 3.0 spec for HTTP API', mimeType: 'application/json' },
    async () => {
      const manifest = getManifestData();
      const routesForDocs: RouteForDocs[] = manifest.routes.map((r) => ({
        pattern: r.pattern,
        method: r.method,
        params: r.params,
        file: path.join(root, r.file),
      }));
      const spec = generateOpenApiSpec(routesForDocs, { apiBasePath: config.apiBasePath });
      return { contents: [{ uri: OPENAPI_URI, text: JSON.stringify(spec, null, 2) }] };
    }
  );

  server.registerResource(
    'vitek-api-asyncapi',
    ASYNCAPI_URI,
    { title: 'AsyncAPI spec', description: 'AsyncAPI 2.x spec for WebSockets', mimeType: 'application/json' },
    async () => {
      const manifest = getManifestData();
      const socketsForDocs = manifest.sockets.map((s) => ({ pattern: s.pattern }));
      const spec = generateAsyncApiSpec(socketsForDocs, config.socketBasePath, {});
      return { contents: [{ uri: ASYNCAPI_URI, text: JSON.stringify(spec, null, 2) }] };
    }
  );

  server.registerTool(
    'vitek_api_call',
    {
      title: 'Call project API',
      description:
        'Calls an endpoint of the local Vitek API. Requires the API to be running (e.g. pnpm dev or pnpm start). baseUrl defaults to config or http://localhost:5173.',
      inputSchema: {
        method: z.enum(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']).describe('HTTP method'),
        path: z.string().describe('Path relative to API base, e.g. health or users/1'),
        body: z.any().optional().describe('Request body (for POST/PUT/PATCH)'),
        headers: z.record(z.string()).optional().describe('Additional headers'),
      },
    },
    async ({ method, path: pathArg, body, headers }) => {
      const baseUrl = config.baseUrl.replace(/\/+$/, '');
      const apiPath = pathArg.startsWith('/') ? pathArg : `/${pathArg}`;
      const url = `${baseUrl}${config.apiBasePath}${apiPath}`;
      try {
        const res = await fetch(url, {
          method: method.toUpperCase(),
          headers: { 'Content-Type': 'application/json', ...headers } as Record<string, string>,
          body: body != null ? JSON.stringify(body) : undefined,
        });
        const text = await res.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
        return {
          content: [
            {
              type: 'text' as const,
              text: `Status: ${res.status}\nBody: ${JSON.stringify(parsed, null, 2)}`,
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Request failed. Is the API running at ${baseUrl}? ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
