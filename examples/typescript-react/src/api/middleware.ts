/**
 * Global middleware for all API routes
 * This middleware is executed for ALL API routes
 */

import type { Middleware } from 'vitek-plugin';

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

