/**
 * Update settings (body + query)
 * PUT /api/settings?applyToAll=true
 */

import type { VitekContext } from 'vitek-plugin';

export type Body = {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
};

export type Query = {
  applyToAll?: boolean;
  overwrite?: boolean;
};

export default async function handler(context: VitekContext) {
  const { body, query } = context;
  
  return {
    message: 'Settings updated',
    applyToAll: query.applyToAll || false,
    overwrite: query.overwrite || false,
    settings: {
      ...body,
      updatedAt: new Date().toISOString(),
    },
  };
}

