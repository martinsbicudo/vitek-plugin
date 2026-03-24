import type { VitekContext } from 'vitek-plugin';
import { hub } from '../lib/events-hub';

export default async function handler(ctx: VitekContext) {
  const body = ctx.body && typeof ctx.body === 'object' ? (ctx.body as { action?: string }) : {};
  const action = typeof body.action === 'string' ? body.action : 'ping';
  await hub.emit('audit', { action });
  return { ok: true, action };
}
