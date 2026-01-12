/**
 * Get comment by post ID and comment ID
 * GET /api/comments/:postId/:commentId
 * 
 * Demonstra rotas com múltiplos parâmetros dinâmicos
 */

import type { VitekContext } from 'vitek-plugin';

export default async function handler(context: VitekContext) {
  const { params } = context;
  
  return {
    postId: params.postId,
    commentId: params.commentId,
    content: `Comment ${params.commentId} on post ${params.postId}`,
    author: 'Jane Doe',
    createdAt: new Date().toISOString(),
  };
}

