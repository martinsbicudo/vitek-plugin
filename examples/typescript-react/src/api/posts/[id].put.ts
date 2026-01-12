/**
 * Update post (full update)
 * PUT /api/posts/:id
 */

import type { VitekContext } from 'vitek-plugin';

export type Body = {
  title: string;
  content: string;
  authorId: number;
  tags?: string[];
};

export default async function handler(context: VitekContext) {
  const { params, body } = context;
  
  return {
    message: 'Post updated (full)',
    id: params.id,
    data: body,
    updatedAt: new Date().toISOString(),
  };
}

