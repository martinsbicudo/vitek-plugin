#!/usr/bin/env node
/**
 * Benchmark: run N requests to a URL and report latency (p50, p99) and throughput (req/s).
 * Usage: node scripts/bench.mjs [url] [n]
 *   url  default http://127.0.0.1:3000/api/health
 *   n    default 1000
 * Example: pnpm run bench
 *          node scripts/bench.mjs http://localhost:35173/api/health 5000
 */
const url = process.argv[2] || 'http://127.0.0.1:3000/api/health';
const n = Number(process.argv[3]) || 1000;

async function run() {
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

run().catch((err) => {
  const code = err?.cause?.code ?? err?.code;
  if (code === 'ECONNREFUSED') {
    console.error('Error: No server is running at ' + url + '.');
    console.error('Start the API first (e.g. cd examples/basic-js && pnpm run build && pnpm run start),');
    console.error('or pass the correct URL: node scripts/bench.mjs <url> [n]');
  } else {
    console.error(err);
  }
  process.exit(1);
});
