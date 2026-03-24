import type { CrudGeneratorInput, DataAdapterGenerator, GeneratedFile } from '../types.js';
import { toPascalCase } from '../utils.js';

function createTemplate(model: string): string {
  return `import type { VitekContext } from "vitek-plugin";
import { ok } from "vitek-plugin/response";

/**
 * @summary Drizzle CRUD template for ${model}
 * @tag ${model}
 */
export default async function handler(_context: VitekContext) {
  return ok({
    message: "Drizzle adapter template generated. Implement DB queries for ${model}.",
  });
}
`;
}

export const drizzleCrudGenerator: DataAdapterGenerator = {
  name: 'drizzle',
  generateCrud(input: CrudGeneratorInput): GeneratedFile[] {
    const model = toPascalCase(input.model);
    return [
      { path: `${input.outDir}/index.get.ts`, content: createTemplate(model) },
      { path: `${input.outDir}/crud.generated.test.ts`, content: 'import { describe, it, expect } from "vitest";\ndescribe("drizzle scaffold", () => { it("is generated", () => { expect(true).toBe(true); }); });\n' },
    ];
  },
};
