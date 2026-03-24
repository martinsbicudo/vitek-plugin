import { hub } from '../lib/events-hub';
export default async function handler(ctx) {
    const body = ctx.body && typeof ctx.body === 'object' ? ctx.body : {};
    const action = typeof body.action === 'string' ? body.action : 'ping';
    await hub.emit('audit', { action });
    return { ok: true, action };
}
