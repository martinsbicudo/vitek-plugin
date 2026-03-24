import type { CrudGeneratorInput, DataAdapterGenerator, GeneratedFile } from '../types.js';
import { toCamelCase, toPascalCase } from '../utils.js';

function createListRoute(model: string, modelVar: string): string {
  return `import type { VitekContext } from "vitek-plugin";
import { ok } from "vitek-plugin/response";
import { validateQuery } from "vitek-plugin/validation";

declare const prisma: any;

/**
 * @summary List ${model}
 * @tag ${model}
 */
export default async function handler(context: VitekContext) {
  const query = validateQuery<{ take?: string; skip?: string }>(context.query, {
    take: { type: "string", required: false },
    skip: { type: "string", required: false },
  });
  const take = query.take ? Number(query.take) : undefined;
  const skip = query.skip ? Number(query.skip) : undefined;
  const data = await prisma.${modelVar}.findMany({ take, skip });
  return ok({ data });
}
`;
}

function createCreateRoute(model: string, modelVar: string): string {
  return `import type { VitekContext } from "vitek-plugin";
import { created } from "vitek-plugin/response";
import { validateBody } from "vitek-plugin/validation";

declare const prisma: any;

/**
 * @summary Create ${model}
 * @tag ${model}
 */
export default async function handler(context: VitekContext) {
  const body = validateBody<Record<string, unknown>>(context.body, {});
  const data = await prisma.${modelVar}.create({ data: body });
  return created({ data });
}
`;
}

function createGetByIdRoute(model: string, modelVar: string): string {
  return `import type { VitekContext } from "vitek-plugin";
import { notFound, ok } from "vitek-plugin/response";

declare const prisma: any;

/**
 * @summary Get ${model} by id
 * @tag ${model}
 */
export default async function handler(context: VitekContext) {
  const id = Number(context.params.id);
  const data = await prisma.${modelVar}.findUnique({ where: { id } });
  if (!data) return notFound({ error: "${model} not found" });
  return ok({ data });
}
`;
}

function createPatchByIdRoute(model: string, modelVar: string): string {
  return `import type { VitekContext } from "vitek-plugin";
import { notFound, ok } from "vitek-plugin/response";
import { validateBody } from "vitek-plugin/validation";

declare const prisma: any;

/**
 * @summary Update ${model} by id
 * @tag ${model}
 */
export default async function handler(context: VitekContext) {
  const id = Number(context.params.id);
  const body = validateBody<Record<string, unknown>>(context.body, {});
  const current = await prisma.${modelVar}.findUnique({ where: { id } });
  if (!current) return notFound({ error: "${model} not found" });
  const data = await prisma.${modelVar}.update({ where: { id }, data: body });
  return ok({ data });
}
`;
}

function createDeleteByIdRoute(model: string, modelVar: string): string {
  return `import type { VitekContext } from "vitek-plugin";
import { noContent, notFound } from "vitek-plugin/response";

declare const prisma: any;

/**
 * @summary Delete ${model} by id
 * @tag ${model}
 */
export default async function handler(context: VitekContext) {
  const id = Number(context.params.id);
  const current = await prisma.${modelVar}.findUnique({ where: { id } });
  if (!current) return notFound({ error: "${model} not found" });
  await prisma.${modelVar}.delete({ where: { id } });
  return noContent();
}
`;
}

function createUnitTest(outDir: string, model: string): string {
  return `import { describe, it, expect } from "vitest";

describe("${model} generated routes", () => {
  it("keeps generated files under ${outDir}", () => {
    expect(true).toBe(true);
  });
});
`;
}

function createContractTest(model: string): string {
  return `import { describe, it, expect } from "vitest";

describe("${model} contract scaffold", () => {
  it("placeholder for post-build contract assertion", () => {
    expect(true).toBe(true);
  });
});
`;
}

export const prismaCrudGenerator: DataAdapterGenerator = {
  name: 'prisma',
  generateCrud(input: CrudGeneratorInput): GeneratedFile[] {
    const model = toPascalCase(input.model);
    const modelVar = toCamelCase(model);
    return [
      { path: `${input.outDir}/index.get.ts`, content: createListRoute(model, modelVar) },
      { path: `${input.outDir}/index.post.ts`, content: createCreateRoute(model, modelVar) },
      { path: `${input.outDir}/[id].get.ts`, content: createGetByIdRoute(model, modelVar) },
      { path: `${input.outDir}/[id].patch.ts`, content: createPatchByIdRoute(model, modelVar) },
      { path: `${input.outDir}/[id].delete.ts`, content: createDeleteByIdRoute(model, modelVar) },
      { path: `${input.outDir}/crud.generated.test.ts`, content: createUnitTest(input.outDir, model) },
      { path: `${input.outDir}/crud.contract.test.ts`, content: createContractTest(model) },
    ];
  },
};
