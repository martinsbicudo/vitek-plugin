import type { VitekContext } from 'vitek-plugin';

export type Body = {
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
};

export default async function handler(context: VitekContext) {
  const { params, body } = context;

  return {
    message: 'Inter-squad request status updated',
    id: params.id,
    status: body.status,
    updatedAt: new Date().toISOString(),
  };
}
