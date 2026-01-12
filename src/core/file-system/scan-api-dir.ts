/**
 * API directory scanner
 * Core logic - uses Node.js fs but abstracted to be testable
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROUTE_FILE_PATTERN, MIDDLEWARE_FILE_PATTERN, PARAM_PATTERN } from '../../shared/constants.js';
import type { ParsedRoute } from '../routing/route-parser.js';
import { parseRouteFile } from '../routing/route-parser.js';

/**
 * Information about a found middleware
 */
export interface MiddlewareInfo {
  /** Absolute path of the middleware file */
  path: string;
  /** Base pattern calculated from the path (e.g., "posts", "posts/:id", "" for global) */
  basePattern: string;
}

/**
 * Result of API directory scan
 */
export interface ScanResult {
  routes: ParsedRoute[];
  middlewares: MiddlewareInfo[];
}

/**
 * Calculates the base pattern of a middleware based on the path relative to apiDir
 * Example:
 * - src/api/middleware.ts -> "" (global)
 * - src/api/posts/middleware.ts -> "posts"
 * - src/api/posts/[id]/middleware.ts -> "posts/:id"
 */
function calculateMiddlewareBasePattern(middlewarePath: string, apiDir: string): string {
  // Get the directory where the middleware is located
  const middlewareDir = path.dirname(middlewarePath);
  
  // Calculate relative path from middleware directory to apiDir
  const relativePath = path.relative(apiDir, middlewareDir);
  
  // If it's at the root (apiDir), it's a global middleware
  if (!relativePath || relativePath === '.' || relativePath === '') {
    return '';
  }
  
  // Normalize separators
  let pattern = relativePath.replace(/\\/g, '/');
  
  // Remove leading/trailing slashes
  pattern = pattern.replace(/^\/+|\/+$/g, '');
  
  // Convert [id] to :id and [...ids] to *ids
  pattern = pattern.replace(PARAM_PATTERN, (match, isCatchAll, paramName) => {
    if (isCatchAll) {
      return `*${paramName}`;
    }
    return `:${paramName}`;
  });
  
  return pattern;
}

/**
 * Recursively scans a directory looking for route files and middlewares
 */
export function scanApiDirectory(apiDir: string): ScanResult {
  const routes: ParsedRoute[] = [];
  const middlewares: MiddlewareInfo[] = [];
  
  if (!fs.existsSync(apiDir)) {
    return { routes, middlewares };
  }
  
  function scanDir(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        // Check if it's a middleware file
        if (MIDDLEWARE_FILE_PATTERN.test(entry.name)) {
          const basePattern = calculateMiddlewareBasePattern(fullPath, apiDir);
          middlewares.push({
            path: fullPath,
            basePattern,
          });
          continue;
        }
        
        // Check if it's a route file
        if (ROUTE_FILE_PATTERN.test(entry.name)) {
          const parsed = parseRouteFile(fullPath, apiDir);
          if (parsed) {
            routes.push(parsed);
          }
        }
      }
    }
  }
  
  scanDir(apiDir);
  
  // Sort middlewares by depth (most generic first, most specific last)
  // This ensures that when composing, global middlewares come before specific ones
  middlewares.sort((a, b) => {
    const aDepth = a.basePattern ? a.basePattern.split('/').length : 0;
    const bDepth = b.basePattern ? b.basePattern.split('/').length : 0;
    return aDepth - bDepth;
  });
  
  return { routes, middlewares };
}

