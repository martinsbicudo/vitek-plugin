import * as fs from 'fs';

export function extractBodyTypeFromFile(filePath: string): string | undefined {
  return extractTypeFromFile(filePath, 'Body');
}

export function extractQueryTypeFromFile(filePath: string): string | undefined {
  return extractTypeFromFile(filePath, 'Query');
}

export function extractTypeFromFile(filePath: string, typeName: string): string | undefined {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    const typeStart = content.indexOf(`export type ${typeName}`);
    if (typeStart !== -1) {
      const afterStart = content.substring(typeStart);
      const equalsIndex = afterStart.indexOf('=');
      if (equalsIndex !== -1) {
        const afterEquals = afterStart.substring(equalsIndex + 1).trimStart();

        if (afterEquals.startsWith('{')) {
          let braceCount = 0;
          let i = 0;
          let foundClose = false;

          for (; i < afterEquals.length; i++) {
            if (afterEquals[i] === '{') {
              braceCount++;
            } else if (afterEquals[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                foundClose = true;
                break;
              }
            }
          }

          if (foundClose) {
            const typeBody = afterEquals.substring(0, i + 1).trim();
            return typeBody;
          }
        } else {
          const semicolonIndex = afterEquals.indexOf(';');
          if (semicolonIndex !== -1) {
            return afterEquals.substring(0, semicolonIndex).trim();
          }
        }
      }
    }

    const interfaceStart = content.indexOf(`export interface ${typeName}`);
    if (interfaceStart !== -1) {
      const afterStart = content.substring(interfaceStart);
      const openBrace = afterStart.indexOf('{');
      if (openBrace !== -1) {
        let braceCount = 0;
        let i = openBrace;
        let foundClose = false;

        for (; i < afterStart.length; i++) {
          if (afterStart[i] === '{') {
            braceCount++;
          } else if (afterStart[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              foundClose = true;
              break;
            }
          }
        }

        if (foundClose) {
          const interfaceBody = afterStart.substring(openBrace + 1, i).trim();
          return `{ ${interfaceBody} }`;
        }
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}
