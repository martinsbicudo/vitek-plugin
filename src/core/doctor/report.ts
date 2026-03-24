import { DEFAULT_PLATFORM_CONFIG } from '../../platform/config.js';
import type { PlatformConfig } from '../../platform/config.js';
import type { DoctorDimensionResult, DoctorReport } from './types.js';
import { countTests, listProjectFiles } from './scan.js';

function exists(files: string[], rel: string): boolean {
  return files.includes(rel);
}

function startsWithAny(files: string[], prefix: string): boolean {
  return files.some((f) => f.startsWith(prefix));
}

function contractsDimension(files: string[]): DoctorDimensionResult {
  let score = 0;
  const notes: string[] = [];
  if (exists(files, '.vitek/contract/openapi.snapshot.json')) {
    score += 10;
  } else {
    notes.push('Add contract snapshot: vitek contract snapshot');
  }
  if (exists(files, '.vitek/contract/asyncapi.snapshot.json')) {
    score += 5;
  } else {
    notes.push('Add AsyncAPI snapshot when socket routes exist');
  }
  if (exists(files, 'docs/guide/contract.md')) {
    score += 5;
  } else {
    notes.push('Document contract checks');
  }
  return { name: 'Contracts', score, max: 20, notes };
}

function testsDimension(files: string[]): DoctorDimensionResult {
  const tests = countTests(files);
  let score = 0;
  const notes: string[] = [];
  if (tests >= 40) score += 12;
  else if (tests >= 20) score += 8;
  else if (tests >= 10) score += 5;
  else notes.push('Increase automated test coverage');
  if (startsWithAny(files, 'examples/') && files.some((f) => f.startsWith('examples/') && /\.(test|spec)\./.test(f))) {
    score += 8;
  } else {
    notes.push('Add example-level tests');
  }
  return { name: 'Tests', score, max: 20, notes };
}

function securityDimension(files: string[]): DoctorDimensionResult {
  let score = 0;
  const notes: string[] = [];
  if (exists(files, 'docs/guide/security.md')) score += 6;
  else notes.push('Add security guide');
  if (exists(files, 'src/platform/redaction.ts')) score += 5;
  else notes.push('Add/redesign redaction utilities');
  if (
    DEFAULT_PLATFORM_CONFIG.ai.redaction.stripHeaders.length > 0 &&
    DEFAULT_PLATFORM_CONFIG.ai.redaction.stripFields.length > 0
  ) {
    score += 4;
  } else {
    notes.push('Define default redaction policy');
  }
  return { name: 'Security', score, max: 15, notes };
}

function observabilityDimension(files: string[], config: PlatformConfig): DoctorDimensionResult {
  let score = 0;
  const notes: string[] = [];
  if (exists(files, 'src/platform/correlation.ts')) score += 4;
  else notes.push('Add request correlation layer');
  if (exists(files, 'src/adapters/vite/logger.ts')) score += 3;
  else notes.push('Add structured request logging');
  if (config.features.observability) score += 3;
  else notes.push('Enable features.observability when ready');
  return { name: 'Observability', score, max: 10, notes };
}

function reliabilityDimension(files: string[], config: PlatformConfig): DoctorDimensionResult {
  let score = 0;
  const notes: string[] = [];
  if (exists(files, 'src/core/dispatch/types.ts')) score += 4;
  else notes.push('Add issue/event dispatch contracts');
  if (exists(files, 'src/core/events/event-bus.ts')) score += 4;
  else notes.push('Add event bus');
  if (exists(files, 'src/core/scheduler/runner.ts')) score += 4;
  else notes.push('Add scheduler runner');
  if (config.features.issueDispatch) score += 3;
  else notes.push('Enable features.issueDispatch when sink is ready');
  return { name: 'Reliability', score, max: 15, notes };
}

function docsDimension(files: string[]): DoctorDimensionResult {
  let score = 0;
  const notes: string[] = [];
  if (exists(files, 'docs/ROADMAP-AI-PLATFORM.md')) score += 4;
  else notes.push('Keep roadmap updated');
  if (exists(files, 'docs/guide/ai-platform-config.md')) score += 3;
  else notes.push('Document platform config');
  if (exists(files, 'docs/guide/mcp-project.md')) score += 3;
  else notes.push('Document MCP project flows');
  return { name: 'Docs', score, max: 10, notes };
}

function architectureDimension(files: string[]): DoctorDimensionResult {
  let score = 0;
  const notes: string[] = [];
  if (startsWithAny(files, 'src/core/contract/')) score += 3;
  else notes.push('Missing contract module split');
  if (startsWithAny(files, 'src/core/dispatch/')) score += 3;
  else notes.push('Missing dispatch module split');
  if (startsWithAny(files, 'src/core/events/')) score += 2;
  else notes.push('Missing events module split');
  if (startsWithAny(files, 'src/core/scheduler/')) score += 2;
  else notes.push('Missing scheduler module split');
  return { name: 'Architecture', score, max: 10, notes };
}

export function buildDoctorReport(root: string, config: PlatformConfig): DoctorReport {
  const files = listProjectFiles(root);
  const dimensions: DoctorDimensionResult[] = [
    contractsDimension(files),
    testsDimension(files),
    securityDimension(files),
    observabilityDimension(files, config),
    reliabilityDimension(files, config),
    docsDimension(files),
    architectureDimension(files),
  ];
  const score = dimensions.reduce((sum, d) => sum + d.score, 0);
  const topActions = dimensions
    .filter((d) => d.score < d.max)
    .sort((a, b) => a.score / a.max - b.score / b.max)
    .flatMap((d) => d.notes.map((n) => `${d.name}: ${n}`))
    .slice(0, 5);
  return { score, dimensions, topActions };
}
