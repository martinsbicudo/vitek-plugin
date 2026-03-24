import * as fs from 'fs';
import * as path from 'path';
import type { DriftIssue } from '../core/contract/types.js';
import { loadMcpConfig } from './mcp-project-config.js';
import {
  ASYNCAPI_SNAPSHOT_FILE,
  CONTRACT_DIR,
  OPENAPI_SNAPSHOT_FILE,
  compareAsyncApiSpecs,
  compareOpenApiSpecs,
  loadProjectContractSpecs,
} from '../core/contract/index.js';

export interface ContractCliOptions {
  root: string;
  apiDir: string;
  apiBasePath: string;
  socketBasePath: string;
  failOn: 'error' | 'warning';
}

function parseContractArgs(argv: string[]): Partial<ContractCliOptions> {
  const out: Partial<ContractCliOptions> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--root=')) out.root = arg.slice(7);
    else if (arg === '--root' && argv[i + 1]) out.root = argv[++i];
    else if (arg.startsWith('--api-dir=')) out.apiDir = arg.slice(10);
    else if (arg === '--api-dir' && argv[i + 1]) out.apiDir = argv[++i];
    else if (arg.startsWith('--fail-on=')) {
      const v = arg.slice(10);
      if (v === 'error' || v === 'warning') out.failOn = v;
    } else if (arg === '--fail-on' && argv[i + 1]) {
      const v = argv[++i];
      if (v === 'error' || v === 'warning') out.failOn = v;
    }
  }
  return out;
}

function resolveOptions(root: string, overrides: Partial<ContractCliOptions>): ContractCliOptions {
  const mcp = loadMcpConfig(root);
  return {
    root,
    apiDir: overrides.apiDir ?? mcp.apiDir,
    apiBasePath: mcp.apiBasePath,
    socketBasePath: mcp.socketBasePath,
    failOn: overrides.failOn ?? 'error',
  };
}

function contractPaths(root: string) {
  const dir = path.join(root, CONTRACT_DIR);
  return {
    dir,
    openApi: path.join(dir, OPENAPI_SNAPSHOT_FILE),
    asyncApi: path.join(dir, ASYNCAPI_SNAPSHOT_FILE),
  };
}

export async function runContractSnapshot(argv: string[]): Promise<void> {
  const parsed = parseContractArgs(argv);
  const root = path.resolve(parsed.root ?? process.cwd());
  const opts = resolveOptions(root, parsed);
  const specs = loadProjectContractSpecs({
    root: opts.root,
    apiDir: opts.apiDir,
    apiBasePath: opts.apiBasePath,
    socketBasePath: opts.socketBasePath,
  });
  const { dir, openApi: openApiPath, asyncApi: asyncApiPath } = contractPaths(opts.root);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(openApiPath, JSON.stringify(specs.openApi, null, 2), 'utf-8');
  console.log(`[vitek] Contract snapshot written: ${path.relative(opts.root, openApiPath)}`);
  if (specs.asyncApi != null) {
    fs.writeFileSync(asyncApiPath, JSON.stringify(specs.asyncApi, null, 2), 'utf-8');
    console.log(`[vitek] AsyncAPI snapshot written: ${path.relative(opts.root, asyncApiPath)}`);
  } else if (fs.existsSync(asyncApiPath)) {
    fs.unlinkSync(asyncApiPath);
    console.log(`[vitek] Removed AsyncAPI snapshot (no socket routes).`);
  }
}

function formatIssues(issues: DriftIssue[]): string {
  if (issues.length === 0) {
    return 'No drift detected.';
  }
  const lines = ['Contract Drift Report', ...issues.map((i) => `- ${i.severity.toUpperCase()}: ${i.message}`)];
  return lines.join('\n');
}

export async function runContractCheck(argv: string[]): Promise<void> {
  const parsed = parseContractArgs(argv);
  const root = path.resolve(parsed.root ?? process.cwd());
  const opts = resolveOptions(root, parsed);
  const { openApi: openApiPath, asyncApi: asyncApiPath } = contractPaths(opts.root);
  if (!fs.existsSync(openApiPath)) {
    console.error(`[vitek] OpenAPI snapshot not found. Run: vitek contract snapshot`);
    process.exit(2);
  }
  const baselineOpen = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
  const specs = loadProjectContractSpecs({
    root: opts.root,
    apiDir: opts.apiDir,
    apiBasePath: opts.apiBasePath,
    socketBasePath: opts.socketBasePath,
  });
  let issues = compareOpenApiSpecs(baselineOpen, specs.openApi);

  if (fs.existsSync(asyncApiPath)) {
    const baselineAsync = JSON.parse(fs.readFileSync(asyncApiPath, 'utf-8'));
    if (specs.asyncApi != null) {
      issues = issues.concat(compareAsyncApiSpecs(baselineAsync, specs.asyncApi));
    } else {
      issues = issues.concat([
        {
          severity: 'error' as const,
          code: 'asyncapi_baseline_orphan',
          message: 'Baseline includes AsyncAPI but project has no socket routes.',
        },
      ]);
    }
  } else if (specs.asyncApi != null) {
    issues = issues.concat([
      {
        severity: 'warning' as const,
        code: 'asyncapi_baseline_missing',
        message: 'Project has socket routes but no AsyncAPI snapshot. Run: vitek contract snapshot',
      },
    ]);
  }

  console.log(formatIssues(issues));

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  if (opts.failOn === 'warning' && (errors > 0 || warnings > 0)) {
    process.exit(1);
  }
  if (opts.failOn === 'error' && errors > 0) {
    process.exit(1);
  }
}

export async function runContract(subCmd: string | undefined, argv: string[]): Promise<void> {
  if (subCmd === 'snapshot') {
    await runContractSnapshot(argv);
    return;
  }
  if (subCmd === 'check') {
    await runContractCheck(argv);
    return;
  }
  console.error('Usage: vitek contract snapshot [--root=DIR] [--api-dir=PATH]');
  console.error('       vitek contract check [--root=DIR] [--api-dir=PATH] [--fail-on=error|warning]');
  process.exit(1);
}
