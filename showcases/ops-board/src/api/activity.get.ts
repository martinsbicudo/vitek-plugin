import type { VitekContext } from 'vitek-plugin';
import { listActivity } from '../lib/store';

export type Query = {
  limit?: number;
};

export default function handler(ctx: VitekContext) {
  const raw = ctx.query.limit;
  const limit =
    typeof raw === 'string' && /^\d+$/.test(raw) ? Math.min(50, parseInt(raw, 10)) : 20;
  return { activity: listActivity(limit) };
}
