/**
 * Create comment on post (params + body + query)
 * POST /api/posts/:id/comments?notify=true
 */

import type { VitekContext } from 'vitek-plugin';

export type Body = {
  text: string;
  authorId: number;
  parentId?: number;
};

export type Query = {
  notify?: boolean;
  sendEmail?: boolean;
};

export default async function handler(context: VitekContext) {
  const { params, body, query } = context;
  
  return {
    message: 'Comment created',
    postId: params.id,
    notify: query.notify || false,
    sendEmail: query.sendEmail || false,
    comment: {
      id: Math.floor(Math.random() * 1000),
      ...body,
      postId: params.id,
      createdAt: new Date().toISOString(),
    },
  };
}

