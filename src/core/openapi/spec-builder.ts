import type { RouteForDocs, OpenApiOptions, RouteMetadata } from './types.js';
import { extractMetadataFromFile } from './jsdoc.js';

export function buildPaths(routes: RouteForDocs[], options: OpenApiOptions): Record<string, unknown> {
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

export function buildSchemas(routes: RouteForDocs[]): Record<string, object> {
  const schemas: Record<string, object> = {};
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

  for (const typeName of typeNames) {
    schemas[typeName] = {
      type: 'object',
      description: `${typeName} schema`,
    };
  }

  return schemas;
}

function convertPatternToOpenApi(pattern: string): string {
  if (!pattern || pattern === '') {
    return '/';
  }

  return '/' + pattern
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}')
    .replace(/\*([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');
}

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

  const parameters: unknown[] = [];

  for (const param of route.params) {
    parameters.push({
      name: param,
      in: 'path',
      required: true,
      schema: { type: 'string' },
      description: metadata.paramDescriptions?.[param] || undefined,
    });
  }

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

  operation.responses = generateResponses(route, metadata);

  return operation;
}

function generateOperationId(route: RouteForDocs): string {
  const patternParts = route.pattern
    .split('/')
    .filter(Boolean)
    .map(part => {
      const clean = part.replace(/^[:*]/, '');
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    });

  return route.method + patternParts.join('');
}

function generateResponses(route: RouteForDocs, metadata: RouteMetadata): object {
  const responses: Record<string, object> = {};

  if (metadata.responses && Object.keys(metadata.responses).length > 0) {
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

  responses['400'] = { description: 'Bad request' };
  responses['401'] = { description: 'Unauthorized' };
  responses['404'] = { description: 'Not found' };
  responses['500'] = { description: 'Internal server error' };

  return responses;
}

function extractTypeFields(typeStr: string): Array<{
  name: string;
  required: boolean;
  schema: object;
  description?: string;
}> {
  const fields: Array<{ name: string; required: boolean; schema: object; description?: string }> = [];
  const cleanType = typeStr.replace(/^[\s\n]+/, '').replace(/[\s\n]+$/, '');

  if (!cleanType.startsWith('{')) {
    return fields;
  }

  const inner = cleanType.slice(1, -1).trim();
  const propLines = inner.split(';').filter(s => s.trim());

  for (const line of propLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

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

function typeStringToJsonSchema(type: string): object {
  const cleanType = type.trim();

  if (cleanType.endsWith('[]')) {
    const itemType = cleanType.slice(0, -2);
    return {
      type: 'array',
      items: typeStringToJsonSchema(itemType),
    };
  }

  if (cleanType.includes('|')) {
    const types = cleanType.split('|').map(t => t.trim());
    const schemas = types.map(t => typeStringToJsonSchema(t));
    return { anyOf: schemas };
  }

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
      if (cleanType.match(/^[A-Z]\w*$/)) {
        return { $ref: `#/components/schemas/${cleanType}` };
      }
      return { type: 'object' };
  }
}

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

function extractTypeReferences(typeStr: string): string[] {
  const refs: string[] = [];
  const matches = typeStr.matchAll(/\b([A-Z][a-zA-Z0-9_]*)\b/g);
  for (const match of matches) {
    if (!['Object', 'Array', 'Date', 'String', 'Number', 'Boolean'].includes(match[1])) {
      refs.push(match[1]);
    }
  }

  return [...new Set(refs)];
}
