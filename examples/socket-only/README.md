# Vitek Socket Example

WebSocket-only example. No HTTP API routes—just WebSocket endpoints under `/ws/*`.

## Features

- ✅ **Pure JavaScript**: No TypeScript
- ✅ **WebSocket only**: Demonstrates socket file-based routing
- ✅ **Generated services**: `socket.services.js` with `connect()`, `connectChat()`
- ✅ **Minimal**: Single HTML page, no framework

## Structure

```
src/
  └── api/
      ├── index.socket.js   # ws://localhost:5173/ws
      └── chat.socket.js    # ws://localhost:5173/ws/chat
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

Visit `http://localhost:5173` and use the demo to connect to `/ws` or `/ws/chat`.

## Production

```bash
pnpm build
pnpm start
```

## Socket Endpoints

| Path      | Description  |
|-----------|--------------|
| `/ws`     | Root socket (echo) |
| `/ws/chat`| Chat socket (echo) |

Both endpoints echo back any message you send.
