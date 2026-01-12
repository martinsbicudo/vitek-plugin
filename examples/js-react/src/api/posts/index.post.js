/**
 * Create post
 * POST /api/posts
 */

export default function handler(context) {
  return {
    message: 'Post created',
    post: {
      id: Math.floor(Math.random() * 1000),
      ...context.body,
      createdAt: new Date().toISOString(),
    },
  };
}
