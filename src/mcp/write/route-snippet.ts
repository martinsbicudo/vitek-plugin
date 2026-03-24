const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

function pathToFileSegment(segment: string): string {
  if (/^\[\.\.\.[^\]]+\]$/.test(segment)) return segment;
  if (/^\[[^\]]+\]$/.test(segment)) return segment;
  if (segment.startsWith('*')) return `[...${segment.slice(1)}]`;
  if (segment.startsWith(':')) return `[${segment.slice(1)}]`;
  return segment;
}

export function buildRouteFileContent(
  pathInput: string,
  method: string,
  ext: 'ts' | 'js'
): { relativeFilePath: string; content: string } {
  const methodLower = method.toLowerCase();
  if (!HTTP_METHODS.includes(methodLower as (typeof HTTP_METHODS)[number])) {
    throw new Error(`Invalid method: ${method}. Use one of ${HTTP_METHODS.join(', ')}`);
  }
  const normalized = pathInput.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const segments = normalized ? normalized.split('/').filter(Boolean) : [];
  const fileSegments = segments.map((s) => pathToFileSegment(s));
  const pathPart = fileSegments.length ? fileSegments.join('/') : 'index';
  const fileName = `${pathPart}.${methodLower}.${ext}`;
  const relativeFilePath = fileName.replace(/\/+/g, '/');

  const paramNames = segments
    .filter(
      (s) =>
        s.startsWith(':') ||
        s.startsWith('*') ||
        /^\[\.\.\.[^\]]+\]$/.test(s) ||
        /^\[[^\]]+\]$/.test(s)
    )
    .map((s) => {
      if (s.startsWith('*')) return s.slice(1);
      if (s.startsWith(':')) return s.slice(1);
      const m = s.match(/^\[\.\.\.?([^\]]+)\]$/);
      return m ? m[1] : s;
    });

  const typeImport = ext === 'ts' ? 'import type { VitekContext } from "vitek-plugin";\n\n' : '';
  const paramsSnippet =
    paramNames.length > 0
      ? `  const { params } = context;\n  return { ${paramNames.map((p) => `${p}: params.${p}`).join(', ')} };`
      : '  return { message: "ok" };';

  const content =
    typeImport +
    `export default async function handler(context${ext === 'ts' ? ': VitekContext' : ''}) {\n` +
    `${paramsSnippet}\n` +
    `}\n`;

  return { relativeFilePath, content };
}
