import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { runScheduleOnce, type ScheduleDefinition } from '../core/scheduler/index.js';

interface ScheduleCliOptions {
  root: string;
  file: string;
  json: boolean;
}

function parseArgs(argv: string[]): ScheduleCliOptions {
  let root = process.cwd();
  let file = 'vitek.schedule.mjs';
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--root=')) root = path.resolve(arg.slice(7));
    else if (arg === '--root' && argv[i + 1]) root = path.resolve(argv[++i]);
    else if (arg.startsWith('--file=')) file = arg.slice(7);
    else if (arg === '--file' && argv[i + 1]) file = argv[++i];
    else if (arg === '--json') json = true;
  }
  return { root, file, json };
}

function extractDefinition(mod: Record<string, unknown>): ScheduleDefinition | null {
  const candidate = (mod.default ?? mod.schedule) as ScheduleDefinition | undefined;
  if (!candidate || !Array.isArray(candidate.tasks)) return null;
  return candidate;
}

export async function runSchedule(subCmd: string | undefined, argv: string[]): Promise<void> {
  if (subCmd !== 'run') {
    console.error('Usage: vitek schedule run [--root=DIR] [--file=vitek.schedule.mjs] [--json]');
    process.exit(1);
    return;
  }
  const opts = parseArgs(argv);
  const filePath = path.isAbsolute(opts.file) ? opts.file : path.join(opts.root, opts.file);
  if (!fs.existsSync(filePath)) {
    console.error(`[vitek] Schedule file not found: ${filePath}`);
    process.exit(2);
    return;
  }
  const mod = (await import(pathToFileURL(filePath).href)) as Record<string, unknown>;
  const definition = extractDefinition(mod);
  if (!definition) {
    console.error('[vitek] Invalid schedule file. Export default defineSchedule({ tasks: [...] })');
    process.exit(1);
    return;
  }
  const result = await runScheduleOnce(definition);
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('Vitek Schedule Run');
    for (const task of result.tasks) {
      const status = task.ok ? 'OK' : 'ERROR';
      const error = task.error ? ` - ${task.error}` : '';
      console.log(`- ${status}: ${task.name} (${task.cron})${error}`);
    }
  }
  if (result.tasks.some((t) => !t.ok)) {
    process.exit(1);
    return;
  }
}
