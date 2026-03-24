import { withSpan } from 'vitek-plugin/observability';
export default async function handler(_ctx) {
    return withSpan('observability-example.demo.get', async (span) => {
        span.setAttribute('example', true);
        return { via: 'withSpan' };
    });
}
