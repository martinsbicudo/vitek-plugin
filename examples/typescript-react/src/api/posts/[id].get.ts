/**
 * Get post by ID
 * GET /api/posts/:id
 */

import type { VitekContext } from 'vitek-plugin';

export default async function handler(context: VitekContext) {
  const { params } = context;
  
  return {
    id: params.id,
    title: `Post ${params.id}`,
    content: `Content for post ${params.id}`,
    author: 'John Doe',
    createdAt: new Date().toISOString(),
  };
}

