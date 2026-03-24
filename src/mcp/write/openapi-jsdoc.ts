export function applyOpenApiSummaryToFileContent(content: string, summary: string): string {
  const re = /(\/\*\*[\s\S]*?\*\/)(\s*\n)(export\s+default)/;
  const m = content.match(re);
  if (!m) {
    return `/**\n * @summary ${summary}\n */\n\n${content}`;
  }
  let jsdoc = m[1];
  if (/\* @summary /m.test(jsdoc)) {
    jsdoc = jsdoc.replace(/\* @summary [^\n]*/m, `* @summary ${summary}`);
  } else {
    jsdoc = jsdoc.replace(/\/\*\*\s*/, `/**\n * @summary ${summary}\n`);
  }
  return content.replace(re, `${jsdoc}${m[2]}${m[3]}`);
}
