export const WEBSOCKETS_URI = 'vitek://docs/websockets';

export const WEBSOCKETS_CONTENT = `# Vitek – WebSockets

File-based socket routes: \`.socket.ts\` or \`.socket.js\` under \`src/api\`. Default base path \`/api/ws\`.

## Naming

| File | Path (default base /api/ws) |
|------|-----------------------------|
| index.socket.js | /api/ws |
| chat.socket.js | /api/ws/chat |
| rooms/[id].socket.js | /api/ws/rooms/:id |

Same \`[param]\` and \`[...rest]\` rules as HTTP routes.

## Handler context (VitekSocketContext)

- \`ctx.socket\` – WebSocket (send, on('message'), close)
- \`ctx.req\` – HTTP upgrade request
- \`ctx.params\` – route params
- \`ctx.path\` – full path (e.g. /api/ws/chat)
- \`ctx.api\` – (when available) internal API client: \`ctx.api.fetch(path, { method?, body? })\`

Export default handler; can return a cleanup function (runs on disconnect).

\`\`\`typescript
export default function handler(ctx) {
  ctx.socket.on('message', (data) => {
    ctx.socket.send(\`Echo: \${data}\`);
  });
  return () => { /* cleanup */ };
}
\`\`\`

## API → Socket (broadcast)

In HTTP handlers, \`context.sockets\` (when available): \`context.sockets.emit(pattern, data)\`. \`pattern\` is the socket route ('' for root, 'chat' for /api/ws/chat).

## Config

\`sockets: { path: '/ws' }\` – custom base path. \`sockets: false\` – disable.
`;
