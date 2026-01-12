/**
 * Upload file (body only, no query, no params)
 * POST /api/files
 */

import type { VitekContext } from 'vitek-plugin';

export type Body = {
  filename: string;
  content: string;
  mimeType: string;
  size: number;
};

export default async function handler(context: VitekContext) {
  const { body } = context;
  
  return {
    message: 'File uploaded',
    file: {
      id: Math.floor(Math.random() * 10000),
      ...body,
      uploadedAt: new Date().toISOString(),
      url: `/files/${Math.floor(Math.random() * 10000)}`,
    },
  };
}

