import type { VitekSocketContext } from 'vitek-plugin';

export default function handler(ctx: VitekSocketContext) {
  ctx.socket.on('message', (data) => {
    ctx.socket.send(`Echo: ${data}`);
  });
  return () => {
    /* cleanup on disconnect */
  };
}
