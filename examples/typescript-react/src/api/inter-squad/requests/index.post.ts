import type { VitekContext } from 'vitek-plugin';

export type Body = {
  title: string;
  description: string;
  fromSquadId: string;
  toSquadId: string;
};

export default async function handler(context: VitekContext) {
  const { body } = context;

  return {
    message: 'Inter-squad request created',
    id: `req-${Date.now()}`,
    ...body,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}
