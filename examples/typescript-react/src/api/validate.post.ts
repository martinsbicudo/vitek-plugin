import type { VitekContext } from 'vitek-plugin';
import { validateBody } from 'vitek-plugin';

const schema = {
  name: { type: 'string' as const, required: true },
  count: { type: 'number' as const, required: true },
};

export default function handler(ctx: VitekContext) {
  const body = validateBody<{ name: string; count: number }>(ctx.body, schema);
  return { received: body };
}
