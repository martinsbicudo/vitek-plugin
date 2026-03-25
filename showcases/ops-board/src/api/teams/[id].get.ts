import type { VitekContext } from 'vitek-plugin';
import { NotFoundError } from 'vitek-plugin';
import { getTeam } from '../../lib/store';

export default function handler(ctx: VitekContext) {
  const team = getTeam(ctx.params.id);
  if (!team) {
    throw new NotFoundError('Team not found');
  }
  return { team };
}
