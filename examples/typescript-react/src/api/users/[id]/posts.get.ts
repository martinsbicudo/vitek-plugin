/**
 * Get user posts (params + query)
 * GET /api/users/:id/posts?limit=10&status=published
 */

import type { VitekContext } from 'vitek-plugin';

export type Query = {
  limit?: number;
  offset?: number;
  status?: 'draft' | 'published' | 'archived';
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
};

export default async function handler(context: VitekContext) {
  const { params, query } = context;
  
  return {
    userId: params.id,
    limit: query.limit || 10,
    offset: query.offset || 0,
    status: query.status || 'published',
    sortBy: query.sortBy || 'createdAt',
    posts: [
      {
        id: 1,
        title: `Post 1 for user ${params.id}`,
        status: query.status || 'published',
      },
      {
        id: 2,
        title: `Post 2 for user ${params.id}`,
        status: query.status || 'published',
      },
    ],
  };
}

