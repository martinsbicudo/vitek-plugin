/**
 * Create post for user (params + body + query)
 * POST /api/users/:id/posts?publish=true
 */

import type { VitekContext } from 'vitek-plugin';

export type Body = {
  title: string;
  content: string;
  tags?: string[];
};

export type Query = {
  publish?: boolean;
  notifyFollowers?: boolean;
};

export default async function handler(context: VitekContext) {
  const { params, body, query } = context;
  
  return {
    message: 'Post created for user',
    userId: params.id,
    publish: query.publish || false,
    notifyFollowers: query.notifyFollowers || false,
    post: {
      id: Math.floor(Math.random() * 1000),
      ...body,
      userId: params.id,
      published: query.publish || false,
      createdAt: new Date().toISOString(),
    },
  };
}

