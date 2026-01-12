/**
 * Update user settings (params + body + query)
 * PATCH /api/users/:id/settings?notify=true
 */

import type { VitekContext } from 'vitek-plugin';

export type Body = {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
};

export type Query = {
  notify?: boolean;
  logChange?: boolean;
};

export default async function handler(context: VitekContext) {
  const { params, body, query } = context;
  
  return {
    message: 'User settings updated',
    userId: params.id,
    notify: query.notify || false,
    logChange: query.logChange || true,
    settings: {
      ...body,
      userId: params.id,
      updatedAt: new Date().toISOString(),
    },
  };
}

