import * as fs from 'fs';
import * as path from 'path';
import { generateCrudFiles, type DataAdapterName } from '../core/generators/index.js';

function parseCrudArgs(argv: string[]): {
  model: string;
  adapter: DataAdapterName;
  outDir: string;
  root: string;
} {
  const model = argv[0];
  if (!model) {
    throw new Error('Model is required. Usage: vitek generate crud <Model> --adapter prisma --out src/api/<model>');
  }
  let adapter: DataAdapterName = 'prisma';
  let outDir = `src/api/${model.toLowerCase()}s`;
  let root = process.cwd();
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--adapter=')) adapter = arg.slice(10) as DataAdapterName;
    else if (arg === '--adapter' && argv[i + 1]) adapter = argv[++i] as DataAdapterName;
    else if (arg.startsWith('--out=')) outDir = arg.slice(6);
    else if (arg === '--out' && argv[i + 1]) outDir = argv[++i];
    else if (arg.startsWith('--root=')) root = path.resolve(arg.slice(7));
    else if (arg === '--root' && argv[i + 1]) root = path.resolve(argv[++i]);
  }
  if (!['prisma', 'drizzle', 'sql'].includes(adapter)) {
    throw new Error(`Unsupported adapter: ${adapter}. Use prisma, drizzle, or sql.`);
  }
  return { model, adapter, outDir, root };
}

export async function runGenerate(subCmd: string | undefined, argv: string[]): Promise<void> {
  if (subCmd !== 'crud') {
    console.error('Usage: vitek generate crud <Model> --adapter prisma|drizzle|sql --out src/api/<name>');
    process.exit(1);
    return;
  }
  try {
    const opts = parseCrudArgs(argv);
    const files = generateCrudFiles(opts);
    for (const file of files) {
      const abs = path.resolve(opts.root, file.path);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, file.content, 'utf-8');
    }
    console.log(`[vitek] Generated ${files.length} file(s) for model ${opts.model} using ${opts.adapter}`);
    for (const file of files) {
      console.log(`- ${file.path}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[vitek] ${message}`);
    process.exit(1);
  }
}
