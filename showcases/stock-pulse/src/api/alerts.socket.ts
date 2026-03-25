import type { VitekSocketContext } from 'vitek-plugin';
import { registerAlertSender } from '../lib/store';

export default function handler(ctx: VitekSocketContext) {
  const send = (data: string) => {
    if (ctx.socket.readyState === 1) {
      ctx.socket.send(data);
    }
  };
  const unsubscribe = registerAlertSender(send);
  ctx.socket.on('close', unsubscribe);
  send(JSON.stringify({ type: 'connected', channel: 'alerts' }));
  return unsubscribe;
}
