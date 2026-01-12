/**
 * Delete comment
 * DELETE /api/comments/:postId/:commentId
 */

import type { VitekContext } from 'vitek-plugin';

export default async function handler(context: VitekContext) {
  const { params } = context;
  
  return {
    message: 'Comment deleted',
    postId: params.postId,
    commentId: params.commentId,
    deletedAt: new Date().toISOString(),
  };
}

