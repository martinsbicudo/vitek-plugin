# WebSockets

Vitek supports file-based WebSocket routes alongside HTTP API routes. Socket files use the `.socket.ts` or `.socket.js` extension and are served under a configurable base path (default `/api/ws`).

## File-based socket routes

Create socket handlers in the same `src/api` directory as your HTTP routes:

| File | WebSocket path (default base `/api/ws`) |
|------|----------------------------------------|
| `index.socket.js` | `/api/ws` (root) |
| `chat.socket.js` | `/api/ws/chat` |
| `rooms/[id].socket.js` | `/api/ws/rooms/:id` |

Same naming rules as HTTP routes: `[param]` for dynamic segments, `index` for the directory index. Socket files export a default **handler** that receives a context and can return an optional cleanup function.

## Socket handler context

Your handler receives a single argument `ctx` with:

- **`ctx.socket`** – The WebSocket instance (send, close, listen to `message`, `close`).
- **`ctx.req`** – The original HTTP upgrade request.
- **`ctx.params`** – Parsed dynamic params (e.g. `{ id: '1' }` for `rooms/[id].socket.js`).
- **`ctx.path`** – Full path of the request (e.g. `/api/ws/chat`).
- **`ctx.api`** – *(when available)* Internal API client to call your REST endpoints from inside the socket. See [Socket calling API](#socket-calling-internal-api) below.

Example:

```javascript
// src/api/chat.socket.js
export default function handler(ctx) {
  ctx.socket.on('message', (data) => {
    ctx.socket.send(`[chat] Echo: ${data}`);
  });
  return () => {
    // optional cleanup on disconnect
  };
}
```

## Socket calling internal API

When the app runs with shared context (dev server, preview, or vitek-serve), **`ctx.api`** is set. Use it to call your REST API from inside a socket handler without going over the network:

```javascript
// ctx.api.fetch(path, options?)
// path is relative to API base path (e.g. 'health', 'notify', 'users/1')

export default function handler(ctx) {
  ctx.socket.on('message', async (data) => {
    if (ctx.api) {
      const health = await ctx.api.fetch('health');
      ctx.socket.send(JSON.stringify(health));
    }
    ctx.socket.send(`Echo: ${data}`);
  });
  return () => {};
}
```

- **`ctx.api.fetch(path, { method?, body? })`** – Returns a Promise with the parsed JSON (or text). Same base URL as the running server.
- If `ctx.api` is undefined (e.g. in some preview setups), guard with `if (ctx.api)` before calling.

## API calling the socket (broadcast to clients)

From any **HTTP route handler**, you can push data to connected WebSocket clients using **`context.sockets`** (when the plugin provides it):

```javascript
// src/api/notify.post.js
export default function handler(context) {
  const { body = {}, sockets } = context;
  if (sockets) {
    // pattern: '' = root socket (/api/ws), 'chat' = /api/ws/chat
    sockets.emit('', { type: 'notify', message: body.message ?? 'Hello!' });
    // or sockets.emit('chat', data) for /api/ws/chat only
  }
  return { ok: true, sent: !!sockets };
}
```

- **`context.sockets.emit(pattern, data)`** – Sends `data` (string, Buffer, or object; objects are JSON-stringified) to all clients connected to that socket path. `pattern` is the socket route pattern: `''` for root, `'chat'` for chat, etc.
- If there are no sockets or the feature is disabled, `context.sockets` may be undefined; check before use.

## Generated socket services

Vitek generates **`socket.services.js`** (or **`socket.services.ts`** in TypeScript projects) with one function per socket route so the frontend can connect without hardcoding URLs:

```javascript
// Generated (do not edit)
import { connect, connectChat } from './socket.services.js';

const ws = connect();           // connects to /api/ws
ws.onmessage = (e) => console.log(e.data);

const chat = connectChat();     // connects to /api/ws/chat
chat.onmessage = (e) => console.log(e.data);
```

- In **JavaScript-only** projects, only `socket.services.js` is generated (no `socket.types.ts`).
- In **TypeScript** projects, `socket.services.ts` and optional `socket.types.ts` are generated. See [Type generation](/guide/type-generation) for details.

## Configuring the socket path

By default, sockets are served under **`/api/ws`** (same base as API). To use a different path (e.g. `/ws`):

```typescript
vitek({
  sockets: { path: '/ws' },
});
```

Then your sockets are at `ws://host/ws`, `ws://host/ws/chat`, etc. Set **`sockets: false`** to disable WebSockets entirely.

## Logging (request and socket events)

When **`logging.enableRequestLogging`** is `true`, the plugin logs:

- **HTTP:** Request start (`[METHOD] /path →`) and completion (`[METHOD] /path 200 (5ms)`).
- **WebSocket:** `[WS] connected`, `[WS] disconnected`, `[WS] received`, `[WS] emitted` (with optional payload preview).

So one option controls both HTTP and socket event logs. See [Configuration](/guide/configuration).

## Summary

| Direction | Where | How |
|-----------|--------|-----|
| **Socket → API** | Inside a socket handler | `ctx.api?.fetch(path, { method?, body? })` |
| **API → Socket** | Inside an HTTP handler | `context.sockets?.emit(pattern, data)` |
| **Client → Socket** | Browser / client | Use generated `socket.services.js` or connect to `ws://host/api/ws` (or your configured path) |

For a minimal runnable example, see the [socket-only example](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/socket-only) in the repository.
