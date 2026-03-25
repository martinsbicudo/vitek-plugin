function pathToFileSegment(segment: string): string {
  if (/^\[\.\.\.[^\]]+\]$/.test(segment)) return segment;
  if (/^\[[^\]]+\]$/.test(segment)) return segment;
  if (segment.startsWith('*')) return `[...${segment.slice(1)}]`;
  if (segment.startsWith(':')) return `[${segment.slice(1)}]`;
  return segment;
}

export function pathToSocketFilePath(
  pattern: string,
  apiDir: string = 'src/api'
): { filePath: string; snippet: string } {
  const normalized = pattern.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const segments = normalized ? normalized.split('/').filter(Boolean) : [];
  const fileSegments = segments.map((s) => pathToFileSegment(s));
  const pathPart = fileSegments.length ? fileSegments.join('/') : 'index';
  const filePath = `${apiDir}/${pathPart}.socket.ts`.replace(/\/+/g, '/');

  const paramNames = segments
    .filter((s) => s.startsWith(':') || s.startsWith('*') || /^\[\.\.\.[^\]]+\]$/.test(s) || /^\[[^\]]+\]$/.test(s))
    .map((s) => {
      if (s.startsWith('*')) return s.slice(1);
      if (s.startsWith(':')) return s.slice(1);
      const m = s.match(/^\[\.\.\.?([^\]]+)\]$/);
      return m ? m[1] : s;
    });

  const paramsSnippet =
    paramNames.length > 0
      ? `  const { params } = ctx;\n  ctx.socket.on('message', (data) => ctx.socket.send(JSON.stringify({ params, echo: data })));`
      : `  ctx.socket.on('message', (data) => ctx.socket.send(\`Echo: \${data}\`));`;

  const snippet = `import type { VitekSocketContext } from "vitek-plugin";

export default function handler(ctx: VitekSocketContext) {
${paramsSnippet}
  return () => {};
}
`;

  return { filePath, snippet };
}
