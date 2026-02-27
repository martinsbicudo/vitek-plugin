#!/usr/bin/env node
/**
 * E2E WebSocket: build plugin + socket-only, start vitek-serve, connect to /api/ws/chat,
 * send message, assert echo response, then exit.
 * Run from repo root: node scripts/e2e-socket.mjs
 */
import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const EXAMPLE = join(ROOT, 'examples', 'socket-only');
const PORT = Number(process.env.E2E_SOCKET_PORT) || 35174;
const BASE_HTTP = `http://127.0.0.1:${PORT}`;
const BASE_WS = `ws://127.0.0.1:${PORT}`;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      stdio: 'pipe',
      shell: true,
      cwd: opts.cwd || ROOT,
      env: { ...process.env, ...opts.env },
    });
    let err = '';
    p.stderr?.on('data', (d) => { err += d; });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Exit ${code}: ${err}`))));
  });
}

async function waitUp(maxMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await fetch(`${BASE_HTTP}/`);
      if (r.ok) return;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Server not ready');
}

function connectAndEcho(url, message, expectedSubstring) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket message timeout'));
    }, 5000);
    ws.on('open', () => ws.send(message));
    ws.on('message', (data) => {
      clearTimeout(timeout);
      const text = Buffer.isBuffer(data) ? data.toString() : data;
      if (typeof text !== 'string' || !text.includes(expectedSubstring)) {
        ws.close();
        reject(new Error(`Expected message containing "${expectedSubstring}", got: ${text}`));
        return;
      }
      ws.close();
      resolve();
    });
    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function main() {
  console.log('[e2e-socket] Build plugin');
  await run('pnpm', ['run', 'build']);
  console.log('[e2e-socket] Build socket-only');
  await run('pnpm', ['run', 'build'], { cwd: EXAMPLE });

  const server = spawn('pnpm', ['run', 'start'], {
    cwd: EXAMPLE,
    stdio: 'pipe',
    env: { ...process.env, PORT: String(PORT) },
  });

  try {
    console.log('[e2e-socket] Wait for server');
    await waitUp();
    console.log('[e2e-socket] WebSocket /api/ws/chat echo');
    await connectAndEcho(
      `${BASE_WS}/api/ws/chat`,
      'e2e-hello',
      '[chat] Echo: e2e-hello'
    );
    console.log('[e2e-socket] WebSocket /api/ws (root) echo');
    await connectAndEcho(
      `${BASE_WS}/api/ws`,
      'e2e-root',
      '[root] Echo: e2e-root'
    );
    console.log('[e2e-socket] OK');
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((e) => {
  console.error('[e2e-socket]', e.message);
  process.exit(1);
});
