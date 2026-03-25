import type { Middleware } from 'vitek-plugin';
import { UnauthorizedError } from 'vitek-plugin';

const TOKEN = 'reliable-api-demo';

export default [
  async (context, next) => {
    const t = context.headers['x-internal-token'] ?? context.headers['X-Internal-Token'];
    if (!t || String(t).trim() !== TOKEN) {
      throw new UnauthorizedError('Missing or invalid X-Internal-Token');
    }
    await next();
  },
] satisfies Middleware[];
