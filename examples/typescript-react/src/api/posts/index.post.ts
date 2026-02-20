/**
 * Create a new post
 * 
 * Creates a blog post with the provided data. Requires authentication.
 * 
 * @summary Create post
 * @description Creates a new blog post. The title and content are required.
 *              Returns the created post with generated ID and timestamp.
 * @tag Posts
 * @bodyDescription Post creation data
 * @response 201 {object} - Post created successfully
 * @response 400 - Invalid request body
 * @response 401 - Authentication required
 * @response 500 - Internal server error
 * 
 * POST /api/posts
 */

import type { VitekContext } from 'vitek-plugin';

export type Body = {
  /** Post title (required) */
  title: string;
  /** Post content in markdown */
  content: string;
  /** Author ID number */
  authorId: number;
  /** Optional tags for categorization */
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
