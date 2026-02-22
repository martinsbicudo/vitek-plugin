/**
 * Socket file parser
 * Core logic - no Vite dependencies
 */

import * as path from 'path';
import { SOCKET_FILE_PATTERN } from '../../shared/constants.js';
import { normalizeRoutePath, extractParamsFromPattern, patternToRegex } from '../normalize/normalize-path.js';

/**
 * Result of parsing a socket file
 */
export interface ParsedSocket {
  pattern: string;
  params: string[];
  file: string;
}

/**
 * Extracts socket information from a file path
 *
 * Examples:
 * - src/api/chat.socket.ts -> { pattern: 'chat', params: [], file }
 * - src/api/index.socket.ts -> { pattern: '', params: [], file }
 * - src/api/rooms/[id].socket.ts -> { pattern: 'rooms/:id', params: ['id'], file }
 */
export function parseSocketFile(filePath: string, baseDir: string): ParsedSocket | null {
  const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
  const match = relativePath.match(SOCKET_FILE_PATTERN);
  if (!match) {
    return null;
  }

  const [, pathPart] = match;
  const pattern = normalizeRoutePath(pathPart);
  const params = extractParamsFromPattern(pattern);

  return {
    pattern,
    params,
    file: filePath,
  };
}

export { patternToRegex };
