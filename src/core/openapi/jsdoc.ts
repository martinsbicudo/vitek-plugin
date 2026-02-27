import * as fs from 'fs';
import type { RouteMetadata, ResponseMetadata } from './types.js';

export function extractMetadataFromFile(filePath: string): RouteMetadata {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const metadata: RouteMetadata = {};

    const jsdocRegex = /\/\*\*([\s\S]*?)\*\/\s*(?:export\s+default|export\s+(?:async\s+)?function|const\s+handler)/;
    const match = content.match(jsdocRegex);

    if (!match) {
      return metadata;
    }

    const jsdoc = match[1];

    const summaryMatch = jsdoc.match(/@summary\s+(.+)$/m);
    if (summaryMatch) {
      metadata.summary = summaryMatch[1].trim();
    } else {
      const descMatch = jsdoc.match(/\*\s+([^@\n].+)$/m);
      if (descMatch) {
        metadata.summary = descMatch[1].trim();
      }
    }

    const descriptionMatch = jsdoc.match(/@description\s+([\s\S]*?)(?=\s*@|\s*\*\/|$)/);
    if (descriptionMatch) {
      metadata.description = descriptionMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .join(' ')
        .trim();
    }

    const tagMatches = jsdoc.matchAll(/@tag\s+(\w+)/g);
    metadata.tags = Array.from(tagMatches).map(m => m[1]);

    metadata.deprecated = /@deprecated/.test(jsdoc);

    const responseMatches = jsdoc.matchAll(/@response\s+(\d+)\s+(.+?)(?:\s+-\s*(\{[^}]+\}))?(?:\s+-\s*(.+))?$/gm);
    metadata.responses = {};
    for (const m of responseMatches) {
      const code = m[1];
      const description = m[2]?.trim();
      const type = m[3]?.replace(/[{}]/g, '').trim();
      const exampleStr = m[4]?.trim();

      metadata.responses[code] = {
        description,
        type,
        example: exampleStr ? tryParseJson(exampleStr) : undefined,
      };
    }

    const paramMatches = jsdoc.matchAll(/@param\s+(?:\{[^}]+\}\s+)?(\w+)\s+-\s*(.+)$/gm);
    metadata.paramDescriptions = {};
    for (const m of paramMatches) {
      metadata.paramDescriptions[m[1]] = m[2].trim();
    }

    const bodyDescMatch = jsdoc.match(/@bodyDescription\s+(.+)$/m);
    if (bodyDescMatch) {
      metadata.bodyDescription = bodyDescMatch[1].trim();
    }

    return metadata;
  } catch {
    return {};
  }
}

function tryParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
