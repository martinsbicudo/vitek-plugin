import type { VitekContext } from 'vitek-plugin';
import { validateBody, BadRequestError } from 'vitek-plugin';
import { createTask } from '../lib/store';

export type Body = {
  teamId: string;
  title: string;
  assignee?: string;
};

const schema = {
  teamId: { type: 'string' as const, required: true },
  title: { type: 'string' as const, required: true },
  assignee: { type: 'string' as const, required: false },
};

export default function handler(ctx: VitekContext) {
  const body = validateBody(ctx.body, schema) as Body;
  try {
    const task = createTask({
      teamId: body.teamId,
      title: body.title,
      assignee: body.assignee,
    });
    return { task };
  } catch (e) {
    if (e instanceof Error && e.message === 'Team not found') {
      throw new BadRequestError('Unknown teamId');
    }
    throw e;
  }
}
