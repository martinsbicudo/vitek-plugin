function pathToFileSegment(segment: string): string {
  if (/^\[\.\.\.[^\]]+\]$/.test(segment)) return segment;
  if (/^\[[^\]]+\]$/.test(segment)) return segment;
  if (segment.startsWith('*')) return `[...${segment.slice(1)}]`;
  if (segment.startsWith(':')) return `[${segment.slice(1)}]`;
  return segment;
}

export function pathToMiddlewareFilePath(
  basePattern: string,
  apiDir: string = 'src/api'
): { filePath: string; snippet: string } {
  const normalized = basePattern.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const segments = normalized ? normalized.split('/').filter(Boolean) : [];
  const fileSegments = segments.map((s) => pathToFileSegment(s));
  const dirPart = fileSegments.length ? fileSegments.join('/') : '';
  const filePath = dirPart
    ? `${apiDir}/${dirPart}/middleware.ts`.replace(/\/+/g, '/')
    : `${apiDir}/middleware.ts`.replace(/\/+/g, '/');

  const snippet = `import type { Middleware } from "vitek-plugin";

export default [
  async (context, next) => {
    await next();
  },
] satisfies Middleware[];
`;

  return { filePath, snippet };
}
