import type { VitekContext } from 'vitek-plugin';
import { withSpan } from 'vitek-plugin/observability';

export default async function handler(_ctx: VitekContext) {
  return withSpan('observability-example.demo.get', async (span) => {
    span.setAttribute('example', true);
    return { via: 'withSpan' };
  });
}
