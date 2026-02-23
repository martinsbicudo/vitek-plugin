/**
 * Example endpoint: broadcast a message to WebSocket clients
 * POST /api/notify
 * Body: { message: string, target?: 'root' | 'chat' }
 *
 * Emits to the chosen socket so connected clients receive it.
 */

export default function handler(context) {
  const { body = {}, sockets } = context;
  const message = body.message ?? 'Hello from API!';
  const target = body.target ?? 'root';

  // target maps to socket pattern: root -> '', chat -> 'chat'
  const pattern = target === 'chat' ? 'chat' : '';

  const payload = {
    type: 'notify',
    message,
    at: new Date().toISOString(),
  };

  if (sockets) {
    sockets.emit(pattern, payload);
  }

  return {
    ok: true,
    sent: !!sockets,
    target: pattern ? `/ws/${pattern}` : '/ws',
    message,
  };
}
