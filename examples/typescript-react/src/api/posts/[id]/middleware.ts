/**
 * Middleware specific for individual post routes (with ID)
 * This middleware is executed only for routes that start with /api/posts/:id/*
 * Examples: /api/posts/:id/comments, but NOT /api/posts (list of posts)
 * 
 * Note: This middleware will be executed AFTER the posts middleware (posts/middleware.ts)
 */

import type { Middleware } from 'vitek-plugin';

export default [
  async (context, next) => {
    console.log(`[Posts/:id Middleware] Handling ${context.method.toUpperCase()} ${context.path}`);
    
    // Example: Validate if the post exists before processing the request
    // You can do validation here using context.params.id
    
    if (context.params && 'id' in context.params) {
      const postId = context.params.id;
      console.log(`[Posts/:id Middleware] Validating access to post ID: ${postId}`);
      
      // Example: Check if the user has permission to access this specific post
      // (simplified implementation for demonstration)
    }
    
    await next();
    
    console.log(`[Posts/:id Middleware] Completed ${context.method.toUpperCase()} ${context.path}`);
  },
] satisfies Middleware[];

