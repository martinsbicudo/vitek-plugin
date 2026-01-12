/**
 * Create notification (body + query)
 * POST /api/notifications?priority=high
 */

import type { VitekContext } from 'vitek-plugin';

export type Body = {
  title: string;
  message: string;
  userId: number;
};

export type Query = {
  priority?: 'low' | 'medium' | 'high';
  sendEmail?: boolean;
};

export default async function handler(context: VitekContext) {
  const { body, query } = context;
  
  return {
    message: 'Notification created',
    notification: {
      id: Math.floor(Math.random() * 1000),
      ...body,
      priority: query.priority || 'medium',
      sendEmail: query.sendEmail || false,
      createdAt: new Date().toISOString(),
    },
  };
}

