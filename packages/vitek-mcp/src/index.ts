#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ROUTING_URI, ROUTING_CONTENT } from './resources/routing.js';
import { CONTEXT_URI, CONTEXT_CONTENT } from './resources/context.js';
import { RESPONSE_URI, RESPONSE_CONTENT } from './resources/response.js';
import { MIDDLEWARES_URI, MIDDLEWARES_CONTENT } from './resources/middlewares.js';
import { WEBSOCKETS_URI, WEBSOCKETS_CONTENT } from './resources/websockets.js';
import { VALIDATION_URI, VALIDATION_CONTENT } from './resources/validation.js';
import { ERRORS_URI, ERRORS_CONTENT } from './resources/errors.js';
import { PLUGIN_API_URI, PLUGIN_API_CONTENT } from './resources/plugin-api.js';
import { CONFIGURATION_URI, CONFIGURATION_CONTENT } from './resources/configuration.js';
import { INTROSPECTION_URI, INTROSPECTION_CONTENT } from './resources/introspection.js';
import { pathToRouteFilePath } from './tools/create-route.js';
import { pathToMiddlewareFilePath } from './tools/create-middleware.js';
import { pathToSocketFilePath } from './tools/create-socket.js';
import { suggestViteConfig } from './tools/suggest-vite-config.js';
import { validateConvention } from './tools/validate-convention.js';

const server = new McpServer(
  {
    name: 'vitek-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

server.registerResource(
  'vitek-docs-routing',
  ROUTING_URI,
  {
    title: 'Vitek routing',
    description: 'File-based routing conventions and examples',
    mimeType: 'text/plain',
  },
  async () => ({
    contents: [{ uri: ROUTING_URI, text: ROUTING_CONTENT }],
  })
);

server.registerResource(
  'vitek-docs-context',
  CONTEXT_URI,
  {
    title: 'Vitek context',
    description: 'VitekContext and VitekRequest',
    mimeType: 'text/plain',
  },
  async () => ({
    contents: [{ uri: CONTEXT_URI, text: CONTEXT_CONTENT }],
  })
);

server.registerResource(
  'vitek-docs-response',
  RESPONSE_URI,
  {
    title: 'Vitek response',
    description: 'Response helpers and VitekResponse',
    mimeType: 'text/plain',
  },
  async () => ({
    contents: [{ uri: RESPONSE_URI, text: RESPONSE_CONTENT }],
  })
);

server.registerResource(
  'vitek-docs-middlewares',
  MIDDLEWARES_URI,
  { title: 'Vitek middlewares', description: 'Global and hierarchical middlewares', mimeType: 'text/plain' },
  async () => ({ contents: [{ uri: MIDDLEWARES_URI, text: MIDDLEWARES_CONTENT }] })
);

server.registerResource(
  'vitek-docs-websockets',
  WEBSOCKETS_URI,
  { title: 'Vitek WebSockets', description: 'File-based socket routes and context', mimeType: 'text/plain' },
  async () => ({ contents: [{ uri: WEBSOCKETS_URI, text: WEBSOCKETS_CONTENT }] })
);

server.registerResource(
  'vitek-docs-validation',
  VALIDATION_URI,
  { title: 'Vitek validation', description: 'validateBody, validateQuery, ValidationRule', mimeType: 'text/plain' },
  async () => ({ contents: [{ uri: VALIDATION_URI, text: VALIDATION_CONTENT }] })
);

server.registerResource(
  'vitek-docs-errors',
  ERRORS_URI,
  { title: 'Vitek errors', description: 'HttpError classes and onError', mimeType: 'text/plain' },
  async () => ({ contents: [{ uri: ERRORS_URI, text: ERRORS_CONTENT }] })
);

server.registerResource(
  'vitek-docs-plugin-api',
  PLUGIN_API_URI,
  { title: 'Vitek plugin API', description: 'VitekPlugin, afterTypesGenerated, beforeApiRequest', mimeType: 'text/plain' },
  async () => ({ contents: [{ uri: PLUGIN_API_URI, text: PLUGIN_API_CONTENT }] })
);

server.registerResource(
  'vitek-docs-configuration',
  CONFIGURATION_URI,
  { title: 'Vitek configuration', description: 'VitekOptions reference', mimeType: 'text/plain' },
  async () => ({ contents: [{ uri: CONFIGURATION_URI, text: CONFIGURATION_CONTENT }] })
);

server.registerResource(
  'vitek-docs-introspection',
  INTROSPECTION_URI,
  { title: 'Vitek introspection', description: 'getManifest, getRoutes, getSockets, writeManifest', mimeType: 'text/plain' },
  async () => ({ contents: [{ uri: INTROSPECTION_URI, text: INTROSPECTION_CONTENT }] })
);

server.registerTool(
  'vitek_create_route',
  {
    title: 'Create Vitek route',
    description:
      'Returns a file path and code snippet for a new Vitek route. path can use [id], [...rest], or :id, *rest.',
    inputSchema: {
      path: z.string().describe('Route path, e.g. users/[id] or users/:id or posts/[...ids]'),
      method: z
        .enum(['get', 'post', 'put', 'patch', 'delete', 'head', 'options'])
        .describe('HTTP method'),
      apiDir: z.string().optional().default('src/api').describe('API directory'),
    },
  },
  async ({ path, method, apiDir }) => {
    try {
      const { filePath, snippet } = pathToRouteFilePath(path, method, apiDir);
      return {
        content: [
          {
            type: 'text' as const,
            text: `File: ${filePath}\n\n${snippet}`,
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

server.registerTool(
  'vitek_create_middleware',
  {
    title: 'Create Vitek middleware',
    description: 'Returns file path and snippet for a new middleware. basePattern: e.g. "users" or "posts/[id]" or empty for global.',
    inputSchema: {
      basePattern: z.string().describe('Path segment for middleware scope, or empty for global (src/api/middleware.ts)'),
      apiDir: z.string().optional().default('src/api').describe('API directory'),
    },
  },
  async ({ basePattern, apiDir }) => {
    try {
      const { filePath, snippet } = pathToMiddlewareFilePath(basePattern, apiDir);
      return { content: [{ type: 'text' as const, text: `File: ${filePath}\n\n${snippet}` }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
    }
  }
);

server.registerTool(
  'vitek_create_socket',
  {
    title: 'Create Vitek socket',
    description: 'Returns file path and snippet for a new WebSocket handler. pattern: e.g. "chat" or "rooms/[id]".',
    inputSchema: {
      pattern: z.string().describe('Socket path pattern, e.g. chat or rooms/[id]'),
      apiDir: z.string().optional().default('src/api').describe('API directory'),
    },
  },
  async ({ pattern, apiDir }) => {
    try {
      const { filePath, snippet } = pathToSocketFilePath(pattern, apiDir);
      return { content: [{ type: 'text' as const, text: `File: ${filePath}\n\n${snippet}` }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
    }
  }
);

server.registerTool(
  'vitek_suggest_vite_config',
  {
    title: 'Suggest Vite + Vitek config',
    description: 'Returns a vite.config.ts snippet with vitek() and optional openApi, cors, apiDir, sockets.',
    inputSchema: {
      openApi: z.boolean().optional().describe('Enable OpenAPI docs'),
      cors: z.boolean().optional().describe('Enable CORS'),
      apiDir: z.string().optional().describe('API directory'),
      apiBasePath: z.string().optional().describe('API base path'),
      socketsPath: z.string().optional().describe('Custom socket path, e.g. /ws'),
    },
  },
  async (args) => {
    const options = {
      openApi: args.openApi,
      cors: args.cors,
      apiDir: args.apiDir,
      apiBasePath: args.apiBasePath,
      sockets: args.socketsPath != null ? { path: args.socketsPath } : undefined,
    };
    const snippet = suggestViteConfig(options);
    return { content: [{ type: 'text' as const, text: snippet }] };
  }
);

server.registerTool(
  'vitek_validate_convention',
  {
    title: 'Validate Vitek file convention',
    description: 'Checks if a file path follows Vitek naming (route, middleware, or socket). Returns type, method/pattern if valid.',
    inputSchema: {
      filePath: z.string().describe('Path to file, e.g. src/api/users/[id].get.ts'),
      apiDir: z.string().optional().default('src/api').describe('API directory'),
    },
  },
  async ({ filePath, apiDir }) => {
    const result = validateConvention(filePath, apiDir);
    if (result.valid) {
      const detail =
        result.type === 'route'
          ? `method=${result.method} pattern=${result.pattern} params=[${result.params.join(', ')}]`
          : result.type === 'middleware'
            ? `basePattern=${result.basePattern || '(global)'}`
            : `pattern=${result.pattern} params=[${result.params.join(', ')}]`;
      return { content: [{ type: 'text' as const, text: `Valid ${result.type}: ${detail}` }] };
    }
    return { content: [{ type: 'text' as const, text: result.message }], isError: true };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
