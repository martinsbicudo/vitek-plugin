/**
 * Root WebSocket endpoint
 * ws://localhost:5173/ws
 */

export default function handler(ctx) {
  ctx.socket.on('message', (data) => {
    ctx.socket.send(`[root] Echo: ${data}`);
  });
  return () => {
    /* cleanup on disconnect */
  };
}
