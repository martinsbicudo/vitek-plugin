import type { VitekContext } from 'vitek-plugin';
import { validateBody } from 'vitek-plugin';

export type Body = {
  type: string;
  payload?: unknown;
};

const schema = {
  type: { type: 'string' as const, required: true },
};

export default function handler(ctx: VitekContext) {
  const body = validateBody(ctx.body, schema) as Body;
  return { received: true, type: body.type };
}
