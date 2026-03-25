import { describe, it, expect } from 'vitest';
import { validateConvention } from './validate-convention.js';

describe('validateConvention', () => {
  it('recognizes route file users/[id].get.ts', () => {
    const r = validateConvention('src/api/users/[id].get.ts');
    expect(r.valid).toBe(true);
    if (r.valid && r.type === 'route') {
      expect(r.method).toBe('get');
      expect(r.pattern).toBe('users/:id');
      expect(r.params).toEqual(['id']);
    }
  });

  it('recognizes route file with index', () => {
    const r = validateConvention('src/api/posts/index.post.ts');
    expect(r.valid).toBe(true);
    if (r.valid && r.type === 'route') {
      expect(r.method).toBe('post');
      expect(r.pattern).toBe('posts');
    }
  });

  it('recognizes global middleware', () => {
    const r = validateConvention('src/api/middleware.ts');
    expect(r.valid).toBe(true);
    if (r.valid && r.type === 'middleware') {
      expect(r.basePattern).toBe('');
    }
  });

  it('recognizes nested middleware', () => {
    const r = validateConvention('src/api/posts/middleware.ts');
    expect(r.valid).toBe(true);
    if (r.valid && r.type === 'middleware') {
      expect(r.basePattern).toBe('posts');
    }
  });

  it('recognizes socket file', () => {
    const r = validateConvention('src/api/chat.socket.ts');
    expect(r.valid).toBe(true);
    if (r.valid && r.type === 'socket') {
      expect(r.pattern).toBe('chat');
      expect(r.params).toEqual([]);
    }
  });

  it('recognizes socket with param', () => {
    const r = validateConvention('src/api/rooms/[id].socket.ts');
    expect(r.valid).toBe(true);
    if (r.valid && r.type === 'socket') {
      expect(r.pattern).toBe('rooms/:id');
      expect(r.params).toEqual(['id']);
    }
  });

  it('returns invalid for unknown file', () => {
    const r = validateConvention('src/api/foo.ts');
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.message).toContain('Not a Vitek');
  });

  it('uses custom apiDir for relative path', () => {
    const r = validateConvention('lib/api/health.get.ts', 'lib/api');
    expect(r.valid).toBe(true);
    if (r.valid && r.type === 'route') expect(r.method).toBe('get');
  });
});
