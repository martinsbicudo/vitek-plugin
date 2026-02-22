/**
 * Schema for socket type generation
 * Core logic - no dependencies
 */

import type { ParsedSocket } from '../routing/socket-parser.js';

/**
 * Schema of a socket for type generation
 */
export interface SocketSchema {
  pattern: string;
  params: string[];
  file: string;
}

/**
 * Converts parsed sockets to schema
 */
export function socketsToSchema(sockets: ParsedSocket[]): SocketSchema[] {
  return sockets.map((s) => ({
    pattern: s.pattern,
    params: s.params,
    file: s.file,
  }));
}
