import type { DataAdapterGenerator, DataAdapterName, GeneratedFile } from './types.js';
import { prismaCrudGenerator } from './adapters/prisma.js';
import { drizzleCrudGenerator } from './adapters/drizzle.js';
import { sqlCrudGenerator } from './adapters/sql.js';

const generators: Record<DataAdapterName, DataAdapterGenerator> = {
  prisma: prismaCrudGenerator,
  drizzle: drizzleCrudGenerator,
  sql: sqlCrudGenerator,
};

export function generateCrudFiles(opts: {
  adapter: DataAdapterName;
  model: string;
  outDir: string;
  root: string;
}): GeneratedFile[] {
  const generator = generators[opts.adapter];
  return generator.generateCrud({
    adapter: opts.adapter,
    model: opts.model,
    outDir: opts.outDir,
    root: opts.root,
  });
}
