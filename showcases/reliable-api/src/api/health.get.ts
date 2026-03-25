import type { VitekContext } from 'vitek-plugin';

export default function handler(ctx: VitekContext) {
  return {
    status: 'ok',
    app: 'reliable-api',
    requestId: ctx.requestId ?? null,
  };
}
