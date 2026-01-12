/**
 * Path normalization for API routes
 * Core logic - no Vite dependencies
 */

import { normalizePath as normalizePathUtil } from '../../shared/utils.js';
import { PARAM_PATTERN } from '../../shared/constants.js';

/**
 * Converts a file path to a normalized HTTP route
 * 
 * Examples:
 * - users/[id].get.ts -> users/:id
 * - posts/[...ids].get.ts -> posts/*ids
 * - health.get.ts -> health
 */
export function normalizeRoutePath(filePath: string): string {
  // Remove extensions (.ts, .js) and HTTP method
  let path = filePath
    .replace(/\.(ts|js)$/, '')
    .replace(/\.(get|post|put|patch|delete|head|options)$/, '');
  
  // Normalize separators
  path = path.replace(/\\/g, '/');
  
  // Remove leading/trailing slashes (but preserve empty string for root route)
  path = path.replace(/^\/+|\/+$/g, '');
  
  // If path is empty, it means root route (e.g., health.get.ts)
  if (!path) {
    return '';
  }
  
  // Convert [id] to :id and [...ids] to *ids (catch-all)
  path = path.replace(PARAM_PATTERN, (match, isCatchAll, paramName) => {
    if (isCatchAll) {
      return `*${paramName}`;
    }
    return `:${paramName}`;
  });
  
  // Return without normalizing (without adding /), as it will be used in patternToRegex
  return path;
}

/**
 * Extracts parameters from a path pattern
 * Example: "users/:id/posts/:postId" -> ["id", "postId"]
 */
export function extractParamsFromPattern(pattern: string): string[] {
  const params: string[] = [];
  const paramRegex = /[:*]([^/]+)/g;
  let match;
  
  while ((match = paramRegex.exec(pattern)) !== null) {
    params.push(match[1]);
  }
  
  return params;
}

/**
 * Converts a path pattern to regex for matching
 * Example: "users/:id" -> /^\/users\/([^/]+)$/
 * Example: "posts/*ids" -> /^\/posts\/(.*)$/
 */
export function patternToRegex(pattern: string): RegExp {
  // Normalize pattern: empty route becomes '/', others add / at the beginning
  let normalizedPattern = pattern === '' ? '/' : (pattern.startsWith('/') ? pattern : `/${pattern}`);
  
  // First replace placeholders (before escaping)
  // Replace *param (catch-all) with temporary placeholder
  normalizedPattern = normalizedPattern.replace(/\*(\w+)/g, '__CATCHALL_$1__');
  // Replace :param with temporary placeholder
  normalizedPattern = normalizedPattern.replace(/:(\w+)/g, '__PARAM_$1__');
  
  // Escape special characters
  let regexStr = normalizedPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  
  // Restore placeholders as capture groups
  regexStr = regexStr.replace(/__PARAM_\w+__/g, '([^/]+)');
  regexStr = regexStr.replace(/__CATCHALL_(\w+)__/g, '(.*)');
  
  // Ensure it starts and ends correctly
  if (!regexStr.startsWith('^')) {
    regexStr = '^' + regexStr;
  }
  if (!regexStr.endsWith('$')) {
    regexStr = regexStr + '$';
  }
  
  return new RegExp(regexStr);
}

