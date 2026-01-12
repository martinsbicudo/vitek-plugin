/**
 * Get user by ID
 * GET /api/users/:id
 */

export default function handler(context) {
  return {
    id: context.params.id,
    name: `User ${context.params.id}`,
    email: `user${context.params.id}@example.com`,
    createdAt: new Date().toISOString(),
  };
}
