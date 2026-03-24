export function injectValidationScaffold(content: string): string {
  if (/validateBody\s*\(/.test(content)) {
    return content;
  }
  let next = content;
  const importStmt = 'import { validateBody } from "vitek-plugin/validation";\n';
  if (!/from\s+["']vitek-plugin\/validation["']/.test(next)) {
    const lines = next.split('\n');
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*import\s/.test(lines[i])) lastImport = i;
    }
    if (lastImport >= 0) {
      lines.splice(lastImport + 1, 0, importStmt.trimEnd());
      next = lines.join('\n');
    } else {
      next = importStmt + next;
    }
  }
  const asyncFn = /(export default async function handler\([^)]*\)\s*\{)/;
  const syncFn = /(export default function handler\([^)]*\)\s*\{)/;
  if (asyncFn.test(next)) {
    return next.replace(asyncFn, `$1\n  validateBody(context.body, {});`);
  }
  if (syncFn.test(next)) {
    return next.replace(syncFn, `$1\n  validateBody(context.body, {});`);
  }
  return next;
}
