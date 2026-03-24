import type { VitekContext } from 'vitek-plugin';

export default function handler(ctx: VitekContext) {
  return { status: 'ok', requestId: ctx.requestId ?? null };
}
