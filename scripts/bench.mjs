#!/usr/bin/env node
/**
 * Benchmark: run N requests to a URL and report latency (p50, p99) and throughput (req/s).
 * Usage: node scripts/bench.mjs [url] [n]
 *        node scripts/bench.mjs --with-example [n]
 *   url  default http://127.0.0.1:3000/api/health
 *   n    default 1000
 * --with-example: build plugin + basic-js, start vitek-serve, run bench, run example tests, then stop.
 * Example: pnpm run bench
 *          node scripts/bench.mjs --with-example 2000
 */
import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const EXAMPLE = join(ROOT, 'examples', 'basic-js');
const BENCH_PORT = Number(process.env.BENCH_PORT) || 39567;

const withExample = process.argv[2] === '--with-example';
const url = withExample ? `http://127.0.0.1:${BENCH_PORT}/api/health` : (process.argv[2] || 'http://127.0.0.1:3000/api/health');
const n = Number(withExample ? process.argv[3] : process.argv[3]) || 1000;

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

async function waitUp(baseUrl, maxMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await fetch(baseUrl);
      if (r.ok) return;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Server not ready');
}

function waitForServerExit(server, timeoutMs = 3000) {
  return new Promise((resolve) => {
    if (server.exitCode !== null) {
      resolve();
      return;
    }
    const done = () => {
      clearTimeout(t);
      server.removeListener('exit', onExit);
      resolve();
    };
    const onExit = () => done();
    server.once('exit', onExit);
    const t = setTimeout(() => {
      server.kill('SIGKILL');
      setTimeout(done, 500);
    }, timeoutMs);
  });
}

async function runBenchmark() {
  const times = [];
  const start = performance.now();
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    const res = await fetch(url);
    await res.text();
    times.push(performance.now() - t0);
  }
  const total = performance.now() - start;
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p99 = times[Math.floor(times.length * 0.99)];
  const rps = (n / total) * 1000;
  console.log(`URL: ${url}`);
  console.log(`Requests: ${n}`);
  console.log(`Total: ${(total / 1000).toFixed(2)}s`);
  console.log(`Throughput: ${rps.toFixed(0)} req/s`);
  console.log(`Latency p50: ${p50.toFixed(2)}ms`);
  console.log(`Latency p99: ${p99.toFixed(2)}ms`);
}

async function main() {
  if (!withExample) {
    await runBenchmark();
    return;
  }
  console.log('[bench] Build plugin');
  await run('pnpm', ['run', 'build']);
  console.log('[bench] Build basic-js');
  await run('pnpm', ['run', 'build'], { cwd: EXAMPLE });

  const server = spawn('pnpm', ['run', 'start'], {
    cwd: EXAMPLE,
    stdio: 'pipe',
    env: { ...process.env, PORT: String(BENCH_PORT) },
  });

  try {
    console.log('[bench] Wait for server');
    await waitUp(`http://127.0.0.1:${BENCH_PORT}/api/health`);
    console.log('[bench] Run benchmark');
    await runBenchmark();
    console.log('[bench] Run example tests');
    await run('pnpm', ['test'], { cwd: EXAMPLE });
    console.log('[bench] Done');
  } finally {
    server.kill('SIGTERM');
    await waitForServerExit(server, 3000);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    const code = err?.cause?.code ?? err?.code;
    if (code === 'ECONNREFUSED') {
      console.error('Error: No server is running at ' + url + '.');
      console.error('Start the API first (e.g. cd examples/basic-js && pnpm run build && pnpm run start),');
      console.error('or use: node scripts/bench.mjs --with-example [n]');
    } else {
      console.error(err);
    }
    process.exit(1);
  });
