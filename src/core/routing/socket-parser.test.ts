import { describe, it, expect } from 'vitest';
import { parseSocketFile, patternToRegex } from './socket-parser.js';

describe('parseSocketFile', () => {
  const baseDir = '/project/src/api';

  it('should parse a simple chat socket', () => {
    const result = parseSocketFile('/project/src/api/chat.socket.ts', baseDir);
    expect(result).toEqual({
      pattern: 'chat',
      params: [],
      file: '/project/src/api/chat.socket.ts',
    });
  });

  it('should parse root index socket', () => {
    const result = parseSocketFile('/project/src/api/index.socket.ts', baseDir);
    expect(result).toEqual({
      pattern: '',
      params: [],
      file: '/project/src/api/index.socket.ts',
    });
  });

  it('should parse socket with dynamic parameter', () => {
    const result = parseSocketFile('/project/src/api/rooms/[id].socket.ts', baseDir);
    expect(result).toEqual({
      pattern: 'rooms/:id',
      params: ['id'],
      file: '/project/src/api/rooms/[id].socket.ts',
    });
  });

  it('should parse socket with multiple dynamic parameters', () => {
    const result = parseSocketFile('/project/src/api/rooms/[roomId]/[userId].socket.ts', baseDir);
    expect(result).toEqual({
      pattern: 'rooms/:roomId/:userId',
      params: ['roomId', 'userId'],
      file: '/project/src/api/rooms/[roomId]/[userId].socket.ts',
    });
  });

  it('should parse .socket.js files', () => {
    const result = parseSocketFile('/project/src/api/chat.socket.js', baseDir);
    expect(result).toEqual({
      pattern: 'chat',
      params: [],
      file: '/project/src/api/chat.socket.js',
    });
  });

  it('should return null for non-socket files', () => {
    expect(parseSocketFile('/project/src/api/health.get.ts', baseDir)).toBeNull();
    expect(parseSocketFile('/project/src/api/users.ts', baseDir)).toBeNull();
    expect(parseSocketFile('/project/src/api/middleware.ts', baseDir)).toBeNull();
  });

  it('should handle nested directories', () => {
    const result = parseSocketFile('/project/src/api/v1/chat.socket.ts', baseDir);
    expect(result).toEqual({
      pattern: 'v1/chat',
      params: [],
      file: '/project/src/api/v1/chat.socket.ts',
    });
  });

  it('should handle Windows-style paths', () => {
    // path.relative() result is OS-dependent; we only assert that socket file is recognized
    const result = parseSocketFile('C:\\project\\src\\api\\chat.socket.ts', 'C:\\project\\src\\api');
    expect(result).not.toBeNull();
    expect(result!.file).toContain('chat.socket');
    expect(result!.params).toEqual([]);
  });
});

describe('patternToRegex (socket use)', () => {
  it('should match root path for empty pattern', () => {
    const regex = patternToRegex('');
    expect(regex.test('/')).toBe(true);
    expect(regex.test('/chat')).toBe(false);
  });

  it('should match chat path for chat pattern', () => {
    const regex = patternToRegex('chat');
    expect(regex.test('/chat')).toBe(true);
    expect(regex.test('/')).toBe(false);
  });
});
