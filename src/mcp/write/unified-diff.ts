export function unifiedFileDiff(relativePath: string, before: string | null, after: string): string {
  const a = before ?? '';
  const b = after;
  if (a === b) {
    return '';
  }
  const header = `--- a/${relativePath}\n+++ b/${relativePath}\n`;
  const al = a.split('\n');
  const bl = b.split('\n');
  if (before == null) {
    return header + bl.map((l) => `+${l}`).join('\n') + (bl.length ? '\n' : '');
  }
  return (
    header +
    `@@ -1,${al.length} +1,${bl.length} @@\n` +
    al.map((l) => `-${l}`).join('\n') +
    '\n' +
    bl.map((l) => `+${l}`).join('\n') +
    '\n'
  );
}
