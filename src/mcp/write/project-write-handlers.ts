import * as fs from 'fs';
import * as path from 'path';
import { getManifest } from '../../core/introspection/manifest.js';
import { parseRouteFile } from '../../core/routing/route-parser.js';
import { resolveApplyMode } from './apply-guard.js';
import { buildRouteFileContent } from './route-snippet.js';
import { computeRouteRisks } from './risks.js';
import { assertUnderApiDir, resolvePathUnderRoot } from './safe-path.js';
import { unifiedFileDiff } from './unified-diff.js';
import { applyOpenApiSummaryToFileContent } from './openapi-jsdoc.js';
import { injectValidationScaffold } from './validation-scaffold.js';
import { buildRouteTestFileContent } from './test-file-content.js';

export interface McpWriteToolResult {
  ok: boolean;
  dryRun: boolean;
  written?: boolean;
  diff: string;
  risk: string[];
  next: string;
  error?: string;
  rejectReason?: string;
  filePath?: string;
}

export interface McpProjectPaths {
  root: string;
  apiDir: string;
  apiBasePath: string;
  baseUrl: string;
}

function okResult(partial: Omit<McpWriteToolResult, 'ok'>): McpWriteToolResult {
  return { ok: true, ...partial };
}

function errResult(message: string): McpWriteToolResult {
  return {
    ok: false,
    dryRun: true,
    diff: '',
    risk: [],
    next: '',
    error: message,
  };
}

export function handleVitekRouteCreate(
  ctx: McpProjectPaths,
  input: {
    routePath: string;
    method: string;
    extension?: 'ts' | 'js';
    dryRun?: boolean;
    apply?: boolean;
  }
): McpWriteToolResult {
  const dryRun = input.dryRun !== false;
  const apply = input.apply === true;
  const ext = input.extension ?? 'ts';
  const apiDirAbs = path.resolve(ctx.root, ctx.apiDir);
  let built: { relativeFilePath: string; content: string };
  try {
    built = buildRouteFileContent(input.routePath, input.method, ext);
  } catch (e) {
    return errResult(e instanceof Error ? e.message : String(e));
  }
  const rel = path.join(ctx.apiDir, built.relativeFilePath).replace(/\\/g, '/');
  const abs = resolvePathUnderRoot(ctx.root, rel);
  if (!abs || !assertUnderApiDir(ctx.root, ctx.apiDir, abs)) {
    return errResult('Invalid path: must stay under project root and api directory.');
  }
  const manifest = getManifest(ctx.root, ctx.apiDir);
  const parsed = parseRouteFile(abs, apiDirAbs);
  const pattern = parsed?.pattern ?? input.routePath.replace(/\\/g, '/');
  const risk = computeRouteRisks(manifest, pattern, input.method.toLowerCase());
  if (fs.existsSync(abs)) {
    risk.unshift('Target file already exists; write would overwrite.');
  }
  const before = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf-8') : null;
  const diff = unifiedFileDiff(rel, before, built.content);
  const resolution = resolveApplyMode(ctx.root, apply, dryRun);
  if (resolution.rejectReason) {
    return okResult({
      dryRun: true,
      diff,
      risk,
      next: resolution.rejectReason,
      rejectReason: resolution.rejectReason,
      filePath: rel,
    });
  }
  if (!resolution.writeAllowed) {
    return okResult({
      dryRun: true,
      diff,
      risk,
      next: 'Call again with apply: true and dryRun: false to write the file (requires vitek.platform.json mcpWriteTools).',
      filePath: rel,
    });
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, built.content, 'utf-8');
  return okResult({
    dryRun: false,
    written: true,
    diff,
    risk,
    next: 'File written.',
    filePath: rel,
  });
}

export function handleVitekRouteUpdate(
  ctx: McpProjectPaths,
  input: { filePath: string; content: string; dryRun?: boolean; apply?: boolean }
): McpWriteToolResult {
  const dryRun = input.dryRun !== false;
  const apply = input.apply === true;
  const rel = input.filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const abs = resolvePathUnderRoot(ctx.root, rel);
  if (!abs || !assertUnderApiDir(ctx.root, ctx.apiDir, abs)) {
    return errResult('Invalid path: must stay under project root and api directory.');
  }
  const before = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf-8') : null;
  if (before === null) {
    return errResult('File does not exist. Use vitek_route_create for new routes.');
  }
  const diff = unifiedFileDiff(rel, before, input.content);
  const risk: string[] = ['Overwrites entire file content.'];
  const resolution = resolveApplyMode(ctx.root, apply, dryRun);
  if (resolution.rejectReason) {
    return okResult({
      dryRun: true,
      diff,
      risk,
      next: resolution.rejectReason,
      rejectReason: resolution.rejectReason,
      filePath: rel,
    });
  }
  if (!resolution.writeAllowed) {
    return okResult({
      dryRun: true,
      diff,
      risk,
      next: 'Call again with apply: true and dryRun: false to write.',
      filePath: rel,
    });
  }
  fs.writeFileSync(abs, input.content, 'utf-8');
  return okResult({
    dryRun: false,
    written: true,
    diff,
    risk,
    next: 'File updated.',
    filePath: rel,
  });
}

export function handleVitekValidationSuggest(
  ctx: McpProjectPaths,
  input: { filePath: string; dryRun?: boolean; apply?: boolean }
): McpWriteToolResult {
  const dryRun = input.dryRun !== false;
  const apply = input.apply === true;
  const rel = input.filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const abs = resolvePathUnderRoot(ctx.root, rel);
  if (!abs || !assertUnderApiDir(ctx.root, ctx.apiDir, abs)) {
    return errResult('Invalid path: must stay under project root and api directory.');
  }
  if (!fs.existsSync(abs)) {
    return errResult('File not found.');
  }
  const before = fs.readFileSync(abs, 'utf-8');
  if (/validateBody\s*\(/.test(before)) {
    return okResult({
      dryRun: true,
      diff: '',
      risk: [],
      next: 'File already calls validateBody; no change.',
      filePath: rel,
    });
  }
  const after = injectValidationScaffold(before);
  const diff = unifiedFileDiff(rel, before, after);
  const risk = [
    'Adds validateBody(context.body, {}); replace {} with a real ValidationSchema.',
    'May not suit GET routes without a body; edit after apply.',
  ];
  const resolution = resolveApplyMode(ctx.root, apply, dryRun);
  if (resolution.rejectReason) {
    return okResult({
      dryRun: true,
      diff,
      risk,
      next: resolution.rejectReason,
      rejectReason: resolution.rejectReason,
      filePath: rel,
    });
  }
  if (!resolution.writeAllowed) {
    return okResult({
      dryRun: true,
      diff,
      risk,
      next: 'Call again with apply: true and dryRun: false to write.',
      filePath: rel,
    });
  }
  fs.writeFileSync(abs, after, 'utf-8');
  return okResult({
    dryRun: false,
    written: true,
    diff,
    risk,
    next: 'Validation scaffold written; tighten schema and remove if not needed.',
    filePath: rel,
  });
}

export function handleVitekTestGenerate(
  ctx: McpProjectPaths,
  input: { routeFilePath: string; dryRun?: boolean; apply?: boolean }
): McpWriteToolResult {
  const dryRun = input.dryRun !== false;
  const apply = input.apply === true;
  const relRoute = input.routeFilePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const absRoute = resolvePathUnderRoot(ctx.root, relRoute);
  if (!absRoute || !assertUnderApiDir(ctx.root, ctx.apiDir, absRoute)) {
    return errResult('Invalid route file path.');
  }
  if (!fs.existsSync(absRoute)) {
    return errResult('Route file not found.');
  }
  const apiDirAbs = path.resolve(ctx.root, ctx.apiDir);
  const parsed = parseRouteFile(absRoute, apiDirAbs);
  if (!parsed) {
    return errResult('Path is not a Vitek route file.');
  }
  const testRel =
    relRoute.replace(/\.(ts|js)$/, `.test.ts`);
  const testAbs = resolvePathUnderRoot(ctx.root, testRel);
  if (!testAbs || !assertUnderApiDir(ctx.root, ctx.apiDir, testAbs)) {
    return errResult('Invalid test output path.');
  }
  const content = buildRouteTestFileContent({
    method: parsed.method,
    pattern: parsed.pattern,
    apiBasePath: ctx.apiBasePath,
    baseUrl: ctx.baseUrl,
  });
  const before = fs.existsSync(testAbs) ? fs.readFileSync(testAbs, 'utf-8') : null;
  const diff = unifiedFileDiff(testRel, before, content);
  const risk: string[] = ['Ensure dev server is running when executing tests that call fetch.'];
  const resolution = resolveApplyMode(ctx.root, apply, dryRun);
  if (resolution.rejectReason) {
    return okResult({
      dryRun: true,
      diff,
      risk,
      next: resolution.rejectReason,
      rejectReason: resolution.rejectReason,
      filePath: testRel,
    });
  }
  if (!resolution.writeAllowed) {
    return okResult({
      dryRun: true,
      diff,
      risk,
      next: 'Call again with apply: true and dryRun: false to write the test file.',
      filePath: testRel,
    });
  }
  fs.mkdirSync(path.dirname(testAbs), { recursive: true });
  fs.writeFileSync(testAbs, content, 'utf-8');
  return okResult({
    dryRun: false,
    written: true,
    diff,
    risk,
    next: 'Test file written.',
    filePath: testRel,
  });
}

export function handleVitekOpenapiSync(
  ctx: McpProjectPaths,
  input: { filePath: string; dryRun?: boolean; apply?: boolean }
): McpWriteToolResult {
  const dryRun = input.dryRun !== false;
  const apply = input.apply === true;
  const rel = input.filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const abs = resolvePathUnderRoot(ctx.root, rel);
  if (!abs || !assertUnderApiDir(ctx.root, ctx.apiDir, abs)) {
    return errResult('Invalid path.');
  }
  if (!fs.existsSync(abs)) {
    return errResult('File not found.');
  }
  const manifest = getManifest(ctx.root, ctx.apiDir);
  const route = manifest.routes.find((r) => r.file === rel || r.file.replace(/\\/g, '/') === rel);
  if (!route) {
    return errResult('No manifest route matches this file; save the route and regenerate manifest if needed.');
  }
  const summary = `${route.method.toUpperCase()} ${route.pattern || '/'}`;
  const before = fs.readFileSync(abs, 'utf-8');
  const after = applyOpenApiSummaryToFileContent(before, summary);
  const diff = unifiedFileDiff(rel, before, after);
  if (diff === '') {
    return okResult({
      dryRun: true,
      diff: '',
      risk: [],
      next: 'JSDoc @summary already matches suggested value.',
      filePath: rel,
    });
  }
  const risk = ['Updates JSDoc only; OpenAPI is regenerated from files on dev/build.'];
  const resolution = resolveApplyMode(ctx.root, apply, dryRun);
  if (resolution.rejectReason) {
    return okResult({
      dryRun: true,
      diff,
      risk,
      next: resolution.rejectReason,
      rejectReason: resolution.rejectReason,
      filePath: rel,
    });
  }
  if (!resolution.writeAllowed) {
    return okResult({
      dryRun: true,
      diff,
      risk,
      next: 'Call again with apply: true and dryRun: false to write.',
      filePath: rel,
    });
  }
  fs.writeFileSync(abs, after, 'utf-8');
  return okResult({
    dryRun: false,
    written: true,
    diff,
    risk,
    next: 'JSDoc @summary updated.',
    filePath: rel,
  });
}
