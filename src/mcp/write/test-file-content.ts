import type { HttpMethod } from '../../shared/constants.js';

function patternToPathSuffix(pattern: string): string {
  if (pattern === '') return '';
  return pattern
    .split('/')
    .filter(Boolean)
    .map((seg) => {
      if (seg.startsWith(':')) return '1';
      if (seg.startsWith('*')) return 'x';
      return seg;
    })
    .join('/');
}

export function buildRouteTestFileContent(opts: {
  method: HttpMethod;
  pattern: string;
  apiBasePath: string;
  baseUrl: string;
}): string {
  const suffix = patternToPathSuffix(opts.pattern);
  const pathPart = suffix ? `${suffix}` : '';
  const urlLine =
    opts.pattern === ''
      ? `const url = \`${opts.baseUrl.replace(/\/$/, '')}${opts.apiBasePath}\`;`
      : `const url = \`${opts.baseUrl.replace(/\/$/, '')}${opts.apiBasePath}/${pathPart}\`;`;

  return (
    `import { describe, it, expect } from "vitest";\n` +
    `${urlLine}\n\n` +
    `describe("${opts.method.toUpperCase()} ${opts.apiBasePath}/${opts.pattern || '(index)'}", () => {\n` +
    `  it("responds", async () => {\n` +
    `    const res = await fetch(url, { method: "${opts.method.toUpperCase()}" });\n` +
    `    expect(res.status).toBeGreaterThanOrEqual(200);\n` +
    `    expect(res.status).toBeLessThan(600);\n` +
    `  });\n` +
    `});\n`
  );
}
