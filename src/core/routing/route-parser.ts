/**
 * Route file parser
 * Core logic - no Vite dependencies
 */

import { ROUTE_FILE_PATTERN } from '../../shared/constants.js';
import { isHttpMethod } from '../../shared/utils.js';
import { normalizeRoutePath, extractParamsFromPattern, patternToRegex } from '../normalize/normalize-path.js';
import type { Route, RouteHandler } from './route-types.js';
import type { HttpMethod } from '../../shared/constants.js';

/**
 * Result of parsing a route file
 */
export interface ParsedRoute {
  method: HttpMethod;
  pattern: string;
  params: string[];
  file: string;
}

/**
 * Extracts route information from a file path
 * 
 * Examples:
 * - src/api/users/[id].get.ts -> { method: 'get', pattern: 'users/:id', params: ['id'] }
 * - src/api/posts/[...ids].get.ts -> { method: 'get', pattern: 'posts/*ids', params: ['ids'] }
 */
export function parseRouteFile(filePath: string, baseDir: string): ParsedRoute | null {
  // Remove base directory from path
  const relativePath = filePath.replace(baseDir, '').replace(/^[/\\]/, '');
  
  // Try to match route file pattern
  const match = relativePath.match(ROUTE_FILE_PATTERN);
  if (!match) {
    return null;
  }
  
  const [, pathPart, methodPart] = match;
  const method = methodPart.toLowerCase();
  
  if (!isHttpMethod(method)) {
    return null;
  }
  
  // Normalize path and extract parameters
  const pattern = normalizeRoutePath(pathPart);
  const params = extractParamsFromPattern(pattern);
  
  return {
    method,
    pattern,
    params,
    file: filePath,
  };
}

/**
 * Creates a route definition from a parsed route and handler
 */
export function createRoute(parsed: ParsedRoute, handler: RouteHandler, bodyType?: string, queryType?: string): Route {
  return {
    pattern: parsed.pattern,
    method: parsed.method,
    handler,
    params: parsed.params,
    file: parsed.file,
    regex: patternToRegex(parsed.pattern),
    bodyType,
    queryType,
  };
}

