/**
 * Global middleware with path matcher: only runs for /api/users/* and /api/posts/*.
 * Routes like /api/health do not get this middleware.
 */

import type { Middleware } from 'vitek-plugin';

export const config = { path: ['/api/users/*', '/api/posts/*'] };

export default [
  // Global logging middleware
  async (context, next) => {
    const startTime = Date.now();
    console.log(`[Global Middleware] ${context.method.toUpperCase()} ${context.path}`);
    
    // Continue to next middleware/handler
    await next();
    
    const duration = Date.now() - startTime;
    console.log(`[Global Middleware] ${context.method.toUpperCase()} ${context.path} completed in ${duration}ms`);
  },
  
  // Basic CORS middleware
  async (context, next) => {
    // In a real environment, you would modify response headers here
    // For now, we just log
    console.log(`[Global Middleware] CORS check for ${context.path}`);
    
    await next();
  },
] satisfies Middleware[];

