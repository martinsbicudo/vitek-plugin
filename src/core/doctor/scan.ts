import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string, out: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
}

export function listProjectFiles(root: string): string[] {
  const out: string[] = [];
  walk(root, out);
  return out.map((f) => path.relative(root, f).replace(/\\/g, '/'));
}

export function countTests(files: string[]): number {
  return files.filter((f) => /\.(test|spec)\.(ts|js|tsx|jsx|mjs|cjs)$/.test(f)).length;
}
