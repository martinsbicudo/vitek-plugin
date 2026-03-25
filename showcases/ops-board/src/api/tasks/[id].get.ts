import type { VitekContext } from 'vitek-plugin';
import { NotFoundError } from 'vitek-plugin';
import { getTask } from '../../lib/store';

export default function handler(ctx: VitekContext) {
  const task = getTask(ctx.params.id);
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  return { task };
}
