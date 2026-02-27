/**
 * vitek init: scaffold src/api and add vitek to vite.config
 * Usage: vitek init [--force]
 * Idempotent: does not overwrite existing files unless --force.
 */

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_API_DIR = 'src/api';
const HEALTH_ROUTE_JS = `/**
 * Health check endpoint
 * GET /api/health
 */

export default function handler() {
  return { ok: true, timestamp: new Date().toISOString() };
}
`;

const VITE_CONFIG_NAMES = ['vite.config.js', 'vite.config.ts', 'vite.config.mjs', 'vite.config.cjs'];

export function parseInitArgs(): { force: boolean } {
  const argv = process.argv.slice(2);
  let force = false;
  for (const arg of argv) {
    if (arg === '--force' || arg === '-f') force = true;
  }
  return { force };
}

/**
 * Ensures directory exists. Creates it and parents if needed.
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Finds the first existing vite config file in cwd.
 */
function findViteConfig(cwd: string): string | null {
  for (const name of VITE_CONFIG_NAMES) {
    const p = path.join(cwd, name);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}

/**
 * Injects vitek import and plugin into config content if not already present.
 * Returns new content or null if no change needed.
 */
export function injectVitekIntoConfig(content: string): string | null {
  const hasVitek = /vitek-plugin|vitek\s*\(/.test(content);
  if (hasVitek) return null;

  let out = content;

  // Add import after first line (so it's at the top with other imports)
  if (!out.includes('vitek-plugin')) {
    const firstNewline = out.indexOf('\n');
    const insertIdx = firstNewline === -1 ? out.length : firstNewline + 1;
    out = out.slice(0, insertIdx) + "import { vitek } from 'vitek-plugin';\n" + out.slice(insertIdx);
  }

  // Add vitek() to plugins array: find plugins: [ and insert vitek(), as first element
  const pluginsMatch = out.match(/plugins:\s*\[/);
  if (!pluginsMatch) return null;
  const insertPluginsIdx = pluginsMatch.index! + pluginsMatch[0].length;
  out = out.slice(0, insertPluginsIdx) + 'vitek(), ' + out.slice(insertPluginsIdx);
  return out;
}

export async function runInit(): Promise<void> {
  const { force } = parseInitArgs();
  const cwd = process.cwd();
  const apiDir = path.join(cwd, DEFAULT_API_DIR);
  const healthPath = path.join(apiDir, 'health.get.ts');

  ensureDir(apiDir);

  if (!fs.existsSync(healthPath) || force) {
    fs.writeFileSync(healthPath, HEALTH_ROUTE_JS, 'utf-8');
    console.log(`[vitek init] Created ${DEFAULT_API_DIR}/health.get.ts`);
  } else {
    console.log(`[vitek init] ${DEFAULT_API_DIR}/health.get.ts already exists (use --force to overwrite)`);
  }

  const configPath = findViteConfig(cwd);
  if (configPath) {
    const content = fs.readFileSync(configPath, 'utf-8');
    const newContent = injectVitekIntoConfig(content);
    if (newContent) {
      fs.writeFileSync(configPath, newContent, 'utf-8');
      console.log(`[vitek init] Added vitek to ${path.basename(configPath)}`);
    } else {
      console.log(`[vitek init] ${path.basename(configPath)} already has vitek`);
    }
  } else {
    console.log('[vitek init] No vite.config.js/ts/mjs/cjs found; add vitek() to your Vite config manually.');
  }
}
