/**
 * Get post comments (params + query)
 * GET /api/posts/:id/comments?limit=20&order=desc
 */

import type { VitekContext } from 'vitek-plugin';

export type Query = {
  limit?: number;
  offset?: number;
  order?: 'asc' | 'desc';
  includeDeleted?: boolean;
};

export default async function handler(context: VitekContext) {
  const { params, query } = context;
  
  return {
    postId: params.id,
    limit: query.limit || 20,
    offset: query.offset || 0,
    order: query.order || 'desc',
    includeDeleted: query.includeDeleted || false,
    comments: [
      {
        id: 1,
        postId: params.id,
        text: `Comment 1 for post ${params.id}`,
      },
      {
        id: 2,
        postId: params.id,
        text: `Comment 2 for post ${params.id}`,
      },
    ],
  };
}

