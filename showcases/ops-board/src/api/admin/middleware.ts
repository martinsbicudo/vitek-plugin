import type { Middleware } from 'vitek-plugin';
import { UnauthorizedError } from 'vitek-plugin';

export default [
  async (context, next) => {
    const uid = context.headers['x-user-id'] ?? context.headers['X-User-Id'];
    if (!uid || String(uid).trim() === '') {
      throw new UnauthorizedError('Missing X-User-Id (mock auth for admin routes)');
    }
    await next();
  },
] satisfies Middleware[];
