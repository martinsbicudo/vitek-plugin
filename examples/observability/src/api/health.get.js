export default function handler(ctx) {
    return { status: 'ok', requestId: ctx.requestId ?? null };
}
