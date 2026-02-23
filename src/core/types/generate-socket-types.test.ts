import { describe, it, expect } from 'vitest';
import { generateSocketTypesContent } from './generate-socket-types.js';
import type { SocketSchema } from './socket-schema.js';

const SOCKET_BASE = '/api/ws';

function socket(pattern: string, params: string[] = [], file?: string): SocketSchema {
  return {
    pattern,
    params,
    file: file ?? `/api/${pattern.replace(/:/g, '[id]')}.socket.ts`,
  };
}

function getExportedParamInterfaceNames(content: string): string[] {
  const matches = content.matchAll(/^export interface (\w+) \{/gm);
  return [...matches].map((m) => m[1]).filter((n) => n !== 'VitekSocketContext');
}

describe('generateSocketTypesContent', () => {
  it('returns valid content for empty sockets', () => {
    const content = generateSocketTypesContent([], SOCKET_BASE);
    expect(content).toContain('VitekSocketRoute = never');
    expect(content).toContain('SOCKET_BASE_PATH');
  });

  it('generates one param interface per unique socket with params', () => {
    const sockets = [socket('rooms/:id', ['id']), socket('chat')];
    const content = generateSocketTypesContent(sockets, SOCKET_BASE);
    const names = getExportedParamInterfaceNames(content);
    expect(names.length).toBe(1);
  });

  it('deduplicates sockets: duplicate pattern produces single param type', () => {
    const sockets = [
      socket('rooms/:id', ['id'], '/api/rooms.socket.ts'),
      socket('rooms/:id', ['id'], '/other/rooms.socket.ts'),
    ];
    const content = generateSocketTypesContent(sockets, SOCKET_BASE);
    const names = getExportedParamInterfaceNames(content);
    expect(names).toHaveLength(1);
  });

  it('deduplicates sockets: pattern in union appears once', () => {
    const sockets = [
      socket('presence'),
      socket('presence'),
    ];
    const content = generateSocketTypesContent(sockets, SOCKET_BASE);
    expect(content).toContain("pattern: 'presence'");
    const count = (content.match(/pattern: 'presence'/g) || []).length;
    expect(count).toBe(1);
  });
});
