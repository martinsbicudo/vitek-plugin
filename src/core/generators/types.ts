export type DataAdapterName = 'prisma' | 'drizzle' | 'sql';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface CrudGeneratorInput {
  adapter: DataAdapterName;
  model: string;
  outDir: string;
  root: string;
}

export interface DataAdapterGenerator {
  name: DataAdapterName;
  generateCrud(input: CrudGeneratorInput): GeneratedFile[];
}
