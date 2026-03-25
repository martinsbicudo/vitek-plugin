import { describe, it, expect } from 'vitest';
import { pathToSocketFilePath } from './create-socket.js';

describe('pathToSocketFilePath', () => {
  it('returns src/api/index.socket.ts for empty pattern', () => {
    const { filePath, snippet } = pathToSocketFilePath('');
    expect(filePath).toBe('src/api/index.socket.ts');
    expect(snippet).toContain('VitekSocketContext');
  });

  it('returns src/api/chat.socket.ts for chat', () => {
    const { filePath } = pathToSocketFilePath('chat');
    expect(filePath).toBe('src/api/chat.socket.ts');
  });

  it('returns src/api/rooms/[id].socket.ts for rooms/[id]', () => {
    const { filePath, snippet } = pathToSocketFilePath('rooms/[id]');
    expect(filePath).toBe('src/api/rooms/[id].socket.ts');
    expect(snippet).toContain('params');
  });

  it('uses custom apiDir when provided', () => {
    const { filePath } = pathToSocketFilePath('chat', 'lib/api');
    expect(filePath).toBe('lib/api/chat.socket.ts');
  });
});
