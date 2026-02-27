/**
 * OpenAPI/Swagger specification generation
 * Core logic - no Vite dependencies
 */

import * as fs from 'fs';
import * as path from 'path';

export type RouteForDocs = {
  pattern: string;
  method: string;
  params: string[];
  file: string;
  bodyType?: string;
  queryType?: string;
};

/**
 * OpenAPI Info object
 */
export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
}

/**
 * OpenAPI Server object
 */
export interface OpenApiServer {
  url: string;
  description?: string;
}

/**
 * OpenAPI specification options
 */
export interface OpenApiOptions {
  /** API information. Uses defaults if not provided. */
  info?: OpenApiInfo;
  /** Server URLs for the API. Defaults to current URL if not provided. */
  servers?: OpenApiServer[];
  /** Base path for API routes. Defaults to "/api". */
  apiBasePath?: string;
}

/**
 * JSDoc metadata extracted from a route file
 */
export interface RouteMetadata {
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  responses?: Record<string, ResponseMetadata>;
  bodyDescription?: string;
  queryDescription?: string;
  paramDescriptions?: Record<string, string>;
}

/**
 * Response metadata from JSDoc
 */
export interface ResponseMetadata {
  description: string;
  type?: string;
  example?: unknown;
}

/** Default OpenAPI info values */
const DEFAULT_OPENAPI_INFO: OpenApiInfo = {
  title: 'Vitek API',
  version: '1.0.0',
  description: 'Auto-generated API documentation',
};

/**
 * Generates a complete OpenAPI 3.0 specification
 */
export function generateOpenApiSpec(routes: RouteForDocs[], options: OpenApiOptions): object {
  const info = { ...DEFAULT_OPENAPI_INFO, ...options.info };
  
  const spec: Record<string, unknown> = {
    openapi: '3.0.3',
    info,
    paths: generatePaths(routes, options),
    components: {
      schemas: generateSchemas(routes),
    },
  };

  if (options.servers && options.servers.length > 0) {
    spec.servers = options.servers;
  }

  return spec;
}

/**
 * Generates OpenAPI paths from routes
 */
function generatePaths(routes: RouteForDocs[], options: OpenApiOptions): Record<string, unknown> {
  const paths: Record<string, unknown> = {};

  for (const route of routes) {
    const openApiPath = convertPatternToOpenApi(route.pattern);
    const metadata = extractMetadataFromFile(route.file);

    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }

    const pathItem = paths[openApiPath] as Record<string, unknown>;
    
    pathItem[route.method] = generateOperationObject(route, metadata, options);
  }

  return paths;
}

/**
 * Converts Vitek pattern to OpenAPI path format
 * Example: "users/:id" -> "/users/{id}"
 * Example: "posts/*ids" -> "/posts/{ids}"
 */
function convertPatternToOpenApi(pattern: string): string {
  if (!pattern || pattern === '') {
    return '/';
  }

  // Convert :param to {param} and *param to {param}
  return '/' + pattern
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}')
    .replace(/\*([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');
}

/**
 * Generates an OpenAPI Operation object for a route
 */
function generateOperationObject(
  route: RouteForDocs,
  metadata: RouteMetadata,
  options: OpenApiOptions
): object {
  const operation: Record<string, unknown> = {
    operationId: generateOperationId(route),
    summary: metadata.summary || `${route.method.toUpperCase()} ${route.pattern}`,
  };

  if (metadata.description) {
    operation.description = metadata.description;
  }

  if (metadata.tags && metadata.tags.length > 0) {
    operation.tags = metadata.tags;
  }

  if (metadata.deprecated) {
    operation.deprecated = true;
  }

  // Parameters (path, query)
  const parameters: unknown[] = [];

  // Path parameters
  for (const param of route.params) {
    parameters.push({
      name: param,
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: metadata.paramDescriptions?.[param] || undefined,
    });
  }

  // Query parameters (if queryType exists)
  if (route.queryType) {
    const queryFields = extractTypeFields(route.queryType);
    for (const field of queryFields) {
      parameters.push({
        name: field.name,
        in: 'query',
        required: field.required,
        schema: field.schema,
        description: field.description,
      });
    }
  }

  if (parameters.length > 0) {
    operation.parameters = parameters;
  }

  // Request body (if bodyType exists and method supports body)
  if (route.bodyType && ['post', 'put', 'patch'].includes(route.method)) {
    operation.requestBody = {
      description: metadata.bodyDescription || 'Request body',
      required: true,
      content: {
        'application/json': {
          schema: typeToSchema(route.bodyType),
        },
      },
    };
  }

  // Responses
  operation.responses = generateResponses(route, metadata);

  return operation;
}

/**
 * Generates a unique operation ID from route
 */
function generateOperationId(route: RouteForDocs): string {
  const patternParts = route.pattern
    .split('/')
    .filter(Boolean)
    .map(part => {
      // Clean parameter markers
      const clean = part.replace(/^[:*]/, '');
      // Capitalize
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    });

  return route.method + patternParts.join('');
}

/**
 * Generates OpenAPI responses object
 */
function generateResponses(route: RouteForDocs, metadata: RouteMetadata): object {
  const responses: Record<string, object> = {};

  if (metadata.responses && Object.keys(metadata.responses).length > 0) {
    // Use JSDoc @response annotations
    for (const [code, responseMeta] of Object.entries(metadata.responses)) {
      responses[code] = {
        description: responseMeta.description,
        content: responseMeta.type ? {
          'application/json': {
            schema: typeStringToJsonSchema(responseMeta.type),
            example: responseMeta.example,
          },
        } : undefined,
      };
    }
  } else {
    // Default responses based on method
    switch (route.method) {
      case 'get':
        responses['200'] = {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        };
        break;
      case 'post':
        responses['201'] = {
          description: 'Created successfully',
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        };
        break;
      case 'put':
      case 'patch':
        responses['200'] = {
          description: 'Updated successfully',
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        };
        break;
      case 'delete':
        responses['204'] = {
          description: 'Deleted successfully',
        };
        break;
    }
  }

  // Always add error responses
  responses['400'] = { description: 'Bad request' };
  responses['401'] = { description: 'Unauthorized' };
  responses['404'] = { description: 'Not found' };
  responses['500'] = { description: 'Internal server error' };

  return responses;
}

/**
 * Extracts metadata from JSDoc comments in a route file
 */
function extractMetadataFromFile(filePath: string): RouteMetadata {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const metadata: RouteMetadata = {};

    // Find JSDoc comment before default export or handler
    const jsdocRegex = /\/\*\*([\s\S]*?)\*\/\s*(?:export\s+default|export\s+(?:async\s+)?function|const\s+handler)/;
    const match = content.match(jsdocRegex);

    if (!match) {
      return metadata;
    }

    const jsdoc = match[1];

    // Extract @summary or first line as summary
    const summaryMatch = jsdoc.match(/@summary\s+(.+)$/m);
    if (summaryMatch) {
      metadata.summary = summaryMatch[1].trim();
    } else {
      // First non-tag line is description/summary
      const descMatch = jsdoc.match(/\*\s+([^@\n].+)$/m);
      if (descMatch) {
        metadata.summary = descMatch[1].trim();
      }
    }

    // Extract @description
    const descriptionMatch = jsdoc.match(/@description\s+([\s\S]*?)(?=\s*@|\s*\*\/|$)/);
    if (descriptionMatch) {
      metadata.description = descriptionMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .join(' ')
        .trim();
    }

    // Extract @tag
    const tagMatches = jsdoc.matchAll(/@tag\s+(\w+)/g);
    metadata.tags = Array.from(tagMatches).map(m => m[1]);

    // Extract @deprecated
    metadata.deprecated = /@deprecated/.test(jsdoc);

    // Extract @response
    const responseMatches = jsdoc.matchAll(/@response\s+(\d+)\s+(.+?)(?:\s+-\s*(\{[^}]+\}))?(?:\s+-\s*(.+))?$/gm);
    metadata.responses = {};
    for (const m of responseMatches) {
      const code = m[1];
      const description = m[2]?.trim();
      const type = m[3]?.replace(/[{}]/g, '').trim();
      const exampleStr = m[4]?.trim();
      
      metadata.responses[code] = {
        description,
        type,
        example: exampleStr ? tryParseJson(exampleStr) : undefined,
      };
    }

    // Extract @param for parameter descriptions
    const paramMatches = jsdoc.matchAll(/@param\s+(?:\{[^}]+\}\s+)?(\w+)\s+-\s*(.+)$/gm);
    metadata.paramDescriptions = {};
    for (const m of paramMatches) {
      metadata.paramDescriptions[m[1]] = m[2].trim();
    }

    // Extract @bodyDescription
    const bodyDescMatch = jsdoc.match(/@bodyDescription\s+(.+)$/m);
    if (bodyDescMatch) {
      metadata.bodyDescription = bodyDescMatch[1].trim();
    }

    return metadata;
  } catch {
    return {};
  }
}

/**
 * Try to parse a string as JSON
 */
function tryParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

/**
 * Extracts fields from a type definition string
 */
function extractTypeFields(typeStr: string): Array<{
  name: string;
  required: boolean;
  schema: object;
  description?: string;
}> {
  const fields: ReturnType<typeof extractTypeFields> = [];

  // Parse object type like { limit?: number; offset?: number }
  const cleanType = typeStr.replace(/^[\s\n]+/, '').replace(/[\s\n]+$/, '');
  
  if (!cleanType.startsWith('{')) {
    return fields;
  }

  // Remove outer braces
  const inner = cleanType.slice(1, -1).trim();
  
  // Split by semicolons (simplistic parsing)
  const propLines = inner.split(';').filter(s => s.trim());

  for (const line of propLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match: name?: type or name: type
    const match = trimmed.match(/^(\w+)(\?)?:\s*(.+)$/);
    if (match) {
      const name = match[1];
      const optional = !!match[2];
      const type = match[3].trim();

      fields.push({
        name,
        required: !optional,
        schema: typeStringToJsonSchema(type),
      });
    }
  }

  return fields;
}

/**
 * Converts a type string to JSON Schema
 */
function typeStringToJsonSchema(type: string): object {
  const cleanType = type.trim();

  // Array types
  if (cleanType.endsWith('[]')) {
    const itemType = cleanType.slice(0, -2);
    return {
      type: 'array',
      items: typeStringToJsonSchema(itemType),
    };
  }

  // Union types (simplified)
  if (cleanType.includes('|')) {
    const types = cleanType.split('|').map(t => t.trim());
    const schemas = types.map(t => typeStringToJsonSchema(t));
    return { anyOf: schemas };
  }

  // Basic types
  switch (cleanType.toLowerCase()) {
    case 'string':
      return { type: 'string' };
    case 'number':
    case 'integer':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'date':
      return { type: 'string', format: 'date-time' };
    case 'object':
      return { type: 'object' };
    case 'any':
      return {};
    default:
      // Could be a custom type reference
      if (cleanType.match(/^[A-Z]\w*$/)) {
        return { $ref: `#/components/schemas/${cleanType}` };
      }
      return { type: 'object' };
  }
}

/**
 * Converts a type definition to JSON Schema
 */
function typeToSchema(typeStr: string): object {
  if (typeStr.trim().startsWith('{')) {
    const fields = extractTypeFields(typeStr);
    const properties: Record<string, object> = {};
    const required: string[] = [];

    for (const field of fields) {
      properties[field.name] = field.schema;
      if (field.required) {
        required.push(field.name);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  return typeStringToJsonSchema(typeStr);
}

/**
 * Generates component schemas from route types
 */
function generateSchemas(routes: RouteForDocs[]): Record<string, object> {
  const schemas: Record<string, object> = {};

  // Collect unique type names referenced in routes
  const typeNames = new Set<string>();

  for (const route of routes) {
    if (route.bodyType) {
      const refs = extractTypeReferences(route.bodyType);
      refs.forEach(ref => typeNames.add(ref));
    }
    if (route.queryType) {
      const refs = extractTypeReferences(route.queryType);
      refs.forEach(ref => typeNames.add(ref));
    }
  }

  // For now, create placeholder schemas
  // In a future version, we could parse actual type definitions from files
  for (const typeName of typeNames) {
    schemas[typeName] = {
      type: 'object',
      description: `${typeName} schema`,
    };
  }

  return schemas;
}

/**
 * Extracts type references from a type string
 */
function extractTypeReferences(typeStr: string): string[] {
  const refs: string[] = [];
  
  // Match capitalized type names (User, Post, etc.)
  const matches = typeStr.matchAll(/\b([A-Z][a-zA-Z0-9_]*)\b/g);
  for (const match of matches) {
    // Exclude primitive-like names
    if (!['Object', 'Array', 'Date', 'String', 'Number', 'Boolean'].includes(match[1])) {
      refs.push(match[1]);
    }
  }

  return [...new Set(refs)];
}

/**
 * Generates the OpenAPI JSON file
 */
export async function generateOpenApiFile(
  outputPath: string,
  routes: RouteForDocs[],
  options: OpenApiOptions
): Promise<void> {
  const spec = generateOpenApiSpec(routes, options);
  
  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');
}

/**
 * Generates Swagger UI HTML
 */
export function generateSwaggerUiHtml(apiJsonPath: string, title: string = 'API Documentation'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '${escapeHtml(apiJsonPath)}',
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.presets.standalone
      ]
    });
  </script>
</body>
</html>`;
}

/**
 * Options for combined API docs (REST + WebSockets)
 */
export interface ApiDocsHtmlOptions {
  /** Path to AsyncAPI JSON (e.g. /asyncapi.json). When set, adds WebSockets tab. */
  asyncApiJsonPath?: string;
}

/**
 * Generates combined API documentation HTML with optional REST (Swagger) and WebSockets (AsyncAPI) tabs
 */
export function generateApiDocsHtml(
  openApiJsonPath: string,
  title: string,
  options: ApiDocsHtmlOptions = {}
): string {
  const hasAsyncApi = Boolean(options.asyncApiJsonPath?.trim());
  const asyncApiPath = options.asyncApiJsonPath ?? '';

  if (!hasAsyncApi) {
    return generateSwaggerUiHtml(openApiJsonPath, title);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <link rel="stylesheet" href="https://unpkg.com/@asyncapi/react-component@1.0.0-next.39/styles/default.min.css">
  <style>
    .vitek-docs-tabs { display: flex; gap: 0; border-bottom: 1px solid #ddd; margin-bottom: 0; padding: 0 1rem; background: #fafafa; }
    .vitek-docs-tab { padding: 0.75rem 1.25rem; cursor: pointer; font-weight: 500; color: #666; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .vitek-docs-tab:hover { color: #333; }
    .vitek-docs-tab.active { color: #4990e2; border-bottom-color: #4990e2; }
    .vitek-docs-panel { display: none; padding: 0; height: calc(100vh - 50px); }
    .vitek-docs-panel.active { display: block; }
    .vitek-docs-panel iframe { border: none; width: 100%; height: 100%; }
    #asyncapi-ui { padding: 1rem; min-height: 100%; box-sizing: border-box; }
  </style>
</head>
<body>
  <div class="vitek-docs-tabs">
    <div class="vitek-docs-tab active" data-tab="rest">REST</div>
    <div class="vitek-docs-tab" data-tab="websockets">WebSockets</div>
  </div>
  <div id="panel-rest" class="vitek-docs-panel active">
    <div id="swagger-ui"></div>
  </div>
  <div id="panel-websockets" class="vitek-docs-panel">
    <div id="asyncapi-ui"></div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '${escapeHtml(openApiJsonPath)}',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.presets.standalone]
    });
  </script>
  <script src="https://unpkg.com/@asyncapi/react-component@1.0.0-next.39/browser/standalone/index.js"></script>
  <script>
    (function() {
      var tabs = document.querySelectorAll('.vitek-docs-tab');
      var panels = document.querySelectorAll('.vitek-docs-panel');
      var asyncApiLoaded = false;
      var asyncApiPath = '${escapeHtml(asyncApiPath)}';
      function showTab(name) {
        tabs.forEach(function(t) { t.classList.toggle('active', t.getAttribute('data-tab') === name); });
        panels.forEach(function(p) {
          var isActive = (p.id === 'panel-' + name);
          p.classList.toggle('active', isActive);
          if (isActive && name === 'websockets' && !asyncApiLoaded && typeof AsyncApiStandalone !== 'undefined') {
            asyncApiLoaded = true;
            fetch(asyncApiPath).then(function(r) { return r.text(); }).then(function(schema) {
              AsyncApiStandalone.render({ schema: schema, config: { show: { sidebar: true } } }, document.getElementById('asyncapi-ui'));
            }).catch(function(err) { document.getElementById('asyncapi-ui').innerHTML = '<p>Failed to load AsyncAPI spec: ' + err.message + '</p>'; });
          }
        });
      }
      tabs.forEach(function(t) { t.addEventListener('click', function() { showTab(t.getAttribute('data-tab')); }); });
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
