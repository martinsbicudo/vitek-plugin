/**
 * Create post
 * POST /api/posts
 */

import type { VitekContext } from 'vitek-plugin';

export type Body = {
  title: string;
  content: string;
  authorId: number;
  tags?: string[];
};

export default async function handler(context: VitekContext) {
  const { body } = context;
  
  return {
    message: 'Post created',
    post: {
      id: Math.floor(Math.random() * 1000),
      ...body,
      createdAt: new Date().toISOString(),
    },
  };
}

