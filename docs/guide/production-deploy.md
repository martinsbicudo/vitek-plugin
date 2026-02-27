# Deployment & integrations

vitek-serve is a single Node.js HTTP server listening on one port. You can put it behind a reverse proxy, run it with a process manager, or inside Docker. This page shows how to combine it with common tools.

## Reverse proxy (nginx / Caddy)

Use a reverse proxy when you need TLS (HTTPS), a custom domain, or to serve multiple apps from one host. vitek-serve listens on a port (e.g. 3000); the proxy forwards traffic to it.

### nginx

Example: forward all traffic for a server to vitek-serve on port 3000.

```nginx
server {
  listen 80;
  server_name myapp.example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Run vitek-serve with the port you chose. If the proxy sends `X-Forwarded-*` headers, use `--trust-proxy` so the API sees the correct client IP and URL:

```bash
vitek-serve --port 3000 --trust-proxy
```

### Caddy

Caddy can proxy and handle TLS automatically:

```text
myapp.example.com {
  reverse_proxy localhost:3000
}
```

Again, run vitek-serve on that port (e.g. `vitek-serve --port 3000`).

### Binding (containers / remote hosts)

If vitek-serve runs in another container or on another machine, bind to all interfaces so the proxy can reach it:

```bash
vitek-serve --port 3000 --host 0.0.0.0
```

---

## Process manager (PM2)

Use PM2 for restarts on crash, logs, and process management.

From your project root (where `package.json` and `dist/` are), start the app using your existing `start` script:

```bash
# If your package.json has "start": "vitek-serve"
pm2 start pnpm --name "my-app" -- start
```

Or with npm:

```bash
pm2 start npm --name "my-app" -- run start
```

Example `ecosystem.config.cjs` for PM2:

```javascript
module.exports = {
  apps: [
    {
      name: 'my-app',
      cwd: '/var/www/my-app',
      script: 'node_modules/.bin/vitek-serve',
      args: '--port 3000',
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
}
```

Then:

```bash
pm2 start ecosystem.config.cjs
```

---

## Docker

The repo includes a full example: [examples/docker](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/docker). It uses Dockerfile.prod and docker-compose.prod to build the app and run vitek-serve in a container (e.g. `vitek-serve --port 5173 --host 0.0.0.0`).

For your own Dockerfile, after building the app (`vite build`), set the container command to run vitek-serve, for example:

```dockerfile
CMD ["vitek-serve", "--port", "5173", "--host", "0.0.0.0"]
```

Or via your npm/pnpm start script if the image has node_modules and the bin available.

---

## Options recap

You can set `PORT` and `HOST` via environment variables when not passing `--port`/`--host` (e.g. `PORT=8080 pnpm start`). CLI flags override env. Full list:

| Option           | Default   | Description                                                       |
| ---------------- | --------- | ----------------------------------------------------------------- |
| `--dir`          | `dist`    | Directory to serve (relative to cwd)                              |
| `--port`         | `3000`    | Port to listen on                                                 |
| `--host`         | `0.0.0.0` | Host to bind to (use `0.0.0.0` in containers)                      |
| `--cors`         | off       | Enable CORS for the API                                           |
| `--trust-proxy`  | off       | Trust `X-Forwarded-*` headers (recommended when behind a proxy)   |

---

## Summary

| Scenario           | What to do |
| ------------------ | ---------- |
| **Reverse proxy**  | Run vitek-serve on a port; point nginx/Caddy at it. Use `--host 0.0.0.0` if the proxy is on another container/host. |
| **PM2**            | Start your app with PM2 using the `start` script or a direct `vitek-serve` command. |
| **Docker**         | Build the app, then run vitek-serve in the container (see [examples/docker](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/docker)). |

For basic usage and how vitek-serve works, see [Production server](./production-server).
