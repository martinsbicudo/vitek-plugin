# Vitek Socket Example

WebSocket-only example. No HTTP API routes—just WebSocket endpoints under `/api/ws/*`.

## Features

- ✅ **Pure JavaScript**: No TypeScript
- ✅ **WebSocket only**: Demonstrates socket file-based routing
- ✅ **Generated services**: `socket.services.js` with `connect()`, `connectChat()`
- ✅ **Minimal**: Single HTML page, no framework

## Structure

```
src/
  └── api/
      ├── index.socket.js   # ws://localhost:5173/api/ws
      ├── chat.socket.js    # ws://localhost:5173/api/ws/chat
      └── notify.post.js    # POST /api/notify — broadcasts to socket (example)
```

## Installation

Build the plugin at the project root first:

```bash
cd ../..
pnpm build

cd examples/socket-only
pnpm install
```

## Development

```bash
pnpm dev
```

Visit `http://localhost:5173`. Connect to `/api/ws` or `/api/ws/chat`, then use **Notify via API** to push a message from the endpoint to the socket (the server logs `[notify] Emitted to ...`).

## Production

```bash
pnpm build
pnpm start
```

## Endpoints

| Path               | Description                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/ws`          | Root socket (echo)                                                                                                                                                        |
| `/api/ws/chat`     | Chat socket (echo)                                                                                                                                                        |
| `POST /api/notify` | Example API that emits to a socket. Body: `{ message, target?: 'root' \| 'chat' }`. Uses `context.sockets.emit(pattern, payload)`; connected clients receive the message. |

## API calling Socket

The `notify.post.js` handler uses **`context.sockets`** (provided by the plugin to HTTP handlers) to broadcast to WebSocket clients:

- `sockets.emit('', data)` sends to the root socket (`/api/ws`).
- `sockets.emit('chat', data)` sends to the chat socket (`/api/ws/chat`).

See [WebSockets — API calling the socket](https://martinsbicudo.github.io/vitek-plugin/guide/websockets.html#api-calling-the-socket-broadcast-to-clients) in the docs.

## Socket calling API

In dev (and when using vitek-serve), socket handlers receive **`ctx.api`**, so you can call your REST API from inside a socket:

```js
// e.g. inside a socket handler
if (ctx.api) {
  const res = await ctx.api.fetch("health");
  ctx.socket.send(JSON.stringify(res));
}
```

See [WebSockets — Socket calling internal API](https://martinsbicudo.github.io/vitek-plugin/guide/websockets.html#socket-calling-internal-api) in the docs.
