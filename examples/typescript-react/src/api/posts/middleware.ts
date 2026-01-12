/**
 * Middleware specific for post routes
 * This middleware is executed for all routes that start with /api/posts/*
 * Examples: /api/posts, /api/posts/:id, /api/posts/:id/comments, etc.
 */

import type { Middleware } from 'vitek-plugin';

export default [
  async (context, next) => {
    console.log(`[Posts Middleware] Handling ${context.method.toUpperCase()} ${context.path}`);
    
    // Example: Validate if the user has permission to access posts
    // (in a real environment, you would check authentication/authorization here)
    
    // Add custom information to context
    // Note: In a real environment, you would modify the context before passing to next()
    
    await next();
    
    console.log(`[Posts Middleware] Completed ${context.method.toUpperCase()} ${context.path}`);
  },
] satisfies Middleware[];

