/**
 * Delete post
 * DELETE /api/posts/:id
 */

import type { VitekContext } from 'vitek-plugin';

export default async function handler(context: VitekContext) {
  const { params } = context;
  
  return {
    message: 'Post deleted',
    id: params.id,
    deletedAt: new Date().toISOString(),
  };
}

