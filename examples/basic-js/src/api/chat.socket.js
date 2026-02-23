/**
 * Chat WebSocket endpoint
 * ws://localhost:5173/ws/chat
 */

export default function handler(ctx) {
  ctx.socket.on('message', (data) => {
    ctx.socket.send(`Echo: ${data}`);
  });
  return () => {
    /* cleanup on disconnect */
  };
}
