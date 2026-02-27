import { validateBody } from 'vitek-plugin';

const schema = {
  name: { type: 'string', required: true },
  count: { type: 'number', required: true },
};

export default function handler(ctx) {
  const body = validateBody(ctx.body, schema);
  return { echoed: body };
}
