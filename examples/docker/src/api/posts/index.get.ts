/**
 * Get all posts
 * GET /api/posts
 */

import type { VitekContext } from 'vitek-plugin';

export default async function handler(context: VitekContext) {
  const { query } = context;
  
  // Example of query params usage
  const limit = query.limit ? Number(query.limit) : 10;
  const offset = query.offset ? Number(query.offset) : 0;
  
  return {
    posts: Array.from({ length: limit }, (_, i) => ({
      id: offset + i + 1,
      title: `Post ${offset + i + 1}`,
      content: `Content for post ${offset + i + 1}`,
    })),
    pagination: {
      limit,
      offset,
      total: 100,
    },
  };
}

