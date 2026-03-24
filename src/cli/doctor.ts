import * as fs from 'fs';
import * as path from 'path';
import { buildDoctorReport } from '../core/doctor/index.js';
import { loadPlatformConfig } from '../platform/config.js';
import { redactObject } from '../platform/redaction.js';

interface DoctorArgs {
  root: string;
  json: boolean;
  aiAnalyze: boolean;
}

function parseArgs(argv: string[]): DoctorArgs {
  let root = process.cwd();
  let json = false;
  let aiAnalyze = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--root=')) root = path.resolve(arg.slice(7));
    else if (arg === '--root' && argv[i + 1]) root = path.resolve(argv[++i]);
    else if (arg === '--json') json = true;
    else if (arg === '--ai-analyze') aiAnalyze = true;
  }
  return { root, json, aiAnalyze };
}

function printText(report: ReturnType<typeof buildDoctorReport>): void {
  console.log(`Vitek Doctor Score: ${report.score}/100`);
  for (const d of report.dimensions) {
    console.log(`- ${d.name}: ${d.score}/${d.max}`);
  }
  if (report.topActions.length > 0) {
    console.log('Top actions:');
    report.topActions.forEach((a, idx) => console.log(`${idx + 1}) ${a}`));
  }
}

function writeLocalAiInput(root: string, payload: unknown): string {
  const outDir = path.join(root, '.vitek', 'doctor');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'ai-input.redacted.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
  return outPath;
}

export async function runDoctor(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const config = loadPlatformConfig(args.root);
  const report = buildDoctorReport(args.root, config);
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printText(report);
  }

  if (args.aiAnalyze) {
    if (!config.ai.enabled || config.ai.mode === 'off') {
      console.log('[vitek] AI analyze skipped: ai.enabled=false or ai.mode=off');
      return;
    }
    const redacted = redactObject(
      {
        project: path.basename(args.root),
        score: report.score,
        dimensions: report.dimensions,
        topActions: report.topActions,
      },
      config.ai.redaction
    );
    if (config.ai.mode === 'local-only') {
      const outPath = writeLocalAiInput(args.root, redacted);
      console.log(`[vitek] AI local-only payload written: ${outPath}`);
      return;
    }
    if (config.ai.mode === 'remote-redacted') {
      console.log('[vitek] AI remote-redacted mode is enabled. Network transport is not configured in this baseline.');
    }
  }
}
