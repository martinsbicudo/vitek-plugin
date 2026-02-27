#!/usr/bin/env node
/**
 * E2E: build plugin + basic-js, start vitek-serve, GET and POST /api, then exit.
 * Run from repo root: node scripts/e2e.mjs
 */
import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const EXAMPLE = join(ROOT, 'examples', 'basic-js');
const PORT = Number(process.env.E2E_PORT) || 35173;
const BASE = `http://127.0.0.1:${PORT}`;

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
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Server not ready');
}

async function main() {
  console.log('[e2e] Build plugin');
  await run('pnpm', ['run', 'build']);
  console.log('[e2e] Build basic-js');
  await run('pnpm', ['run', 'build'], { cwd: EXAMPLE });

  const server = spawn('pnpm', ['run', 'start'], {
    cwd: EXAMPLE,
    stdio: 'pipe',
    env: { ...process.env, PORT: String(PORT) },
  });

  try {
    console.log('[e2e] Wait for server');
    await waitUp();
    console.log('[e2e] GET /api/health');
    const r1 = await fetch(`${BASE}/api/health`);
    if (!r1.ok) throw new Error('GET health ' + r1.status);
    const b1 = await r1.json();
    if (!b1?.status && !b1?.ok) throw new Error('GET body ' + JSON.stringify(b1));
    console.log('[e2e] POST /api/posts');
    const r2 = await fetch(`${BASE}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'E2E', content: 'x', authorId: 1 }),
    });
    if (!r2.ok) throw new Error('POST ' + r2.status);
    const b2 = await r2.json();
    if (!b2?.message && !b2?.post) throw new Error('POST body ' + JSON.stringify(b2));
    console.log('[e2e] OK');
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((e) => {
  console.error('[e2e]', e.message);
  process.exit(1);
});
