import type { VitekContext } from 'vitek-plugin';
import { NotFoundError } from 'vitek-plugin';
import { getTeam, listTasksForTeam } from '../../../lib/store';

export default function handler(ctx: VitekContext) {
  if (!getTeam(ctx.params.id)) {
    throw new NotFoundError('Team not found');
  }
  const status = typeof ctx.query.status === 'string' ? ctx.query.status : undefined;
  return { tasks: listTasksForTeam(ctx.params.id, status) };
}
