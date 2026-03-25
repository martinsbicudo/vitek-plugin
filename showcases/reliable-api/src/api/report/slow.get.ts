import type { VitekContext } from 'vitek-plugin';
import { withSpan } from 'vitek-plugin/observability';

export default function handler(_ctx: VitekContext) {
  return withSpan('reliable-api.report.slow', async (span) => {
    await new Promise((r) => setTimeout(r, 15));
    span.setAttribute('demo', 'slow-report');
    return { report: 'ok', via: 'withSpan' };
  });
}
