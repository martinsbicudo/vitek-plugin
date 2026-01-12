/**
 * Get all posts
 * GET /api/posts
 */

export default function handler(context) {
  const limit = context.query.limit ? Number(context.query.limit) : 10;
  const offset = context.query.offset ? Number(context.query.offset) : 0;
  
  return {
    posts: Array.from({ length: limit }, (_, i) => ({
      id: offset + i + 1,
      title: `Post ${offset + i + 1}`,
      content: `Content for post ${offset + i + 1}`,
    })),
    pagination: {
      limit,
      offset,
      total: 100,
    },
  };
}
