import { describe, it, expect, vi } from 'vitest';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { patternToRegex } from '../normalize/normalize-path.js';
import type { VitekApp } from '../shared/vitek-app.js';
import { createSocketHandler } from './socket-handler.js';

const mockHandleUpgrade = vi.fn((_req: unknown, _socket: unknown, _head: unknown, callback: (ws: unknown) => void) => {
  callback({ on: vi.fn(), readyState: 1 });
});

vi.mock('ws', () => ({
  WebSocketServer: class {
    handleUpgrade = mockHandleUpgrade;
  },
}));

function mockReq(url: string): IncomingMessage {
  return { url } as IncomingMessage;
}

function mockSocket(): Duplex & { destroy: ReturnType<typeof vi.fn> } {
  const destroy = vi.fn();
  return { destroy } as unknown as Duplex & { destroy: ReturnType<typeof vi.fn> };
}

function mockSocketEntry(
  pattern: string,
  params: string[] = [],
  handler: (ctx: unknown) => void = () => {}
) {
  return {
    pattern,
    params,
    file: `/api/${pattern}.socket.ts`,
    regex: patternToRegex(pattern),
    handler,
  };
}

describe('createSocketHandler', () => {
  it('returns no-op function when sockets array is empty', () => {
    const handler = createSocketHandler({ sockets: [] });
    expect(typeof handler).toBe('function');
    const socket = mockSocket();
    handler(mockReq('/api/ws'), socket as Duplex, Buffer.alloc(0));
    expect(socket.destroy).not.toHaveBeenCalled();
  });

  it('ignores requests to /__vite path', () => {
    const sockets = [mockSocketEntry('chat')];
    const handler = createSocketHandler({ sockets, socketBasePath: '/api/ws' });
    const socket = mockSocket();
    handler(mockReq('/__vite/hmr'), socket as Duplex, Buffer.alloc(0));
    expect(socket.destroy).not.toHaveBeenCalled();
  });

  it('ignores requests when path does not start with socketBasePath', () => {
    const sockets = [mockSocketEntry('chat')];
    const handler = createSocketHandler({ sockets, socketBasePath: '/api/ws' });
    const socket = mockSocket();
    handler(mockReq('/other/path'), socket as Duplex, Buffer.alloc(0));
    expect(socket.destroy).not.toHaveBeenCalled();
  });

  it('destroys socket when path is under socketBasePath but no route matches', () => {
    const sockets = [mockSocketEntry('chat')];
    const handler = createSocketHandler({ sockets, socketBasePath: '/api/ws' });
    const socket = mockSocket();
    handler(mockReq('/api/ws/unknown'), socket as Duplex, Buffer.alloc(0));
    expect(socket.destroy).toHaveBeenCalled();
  });

  it('does not destroy socket when path matches a route', () => {
    const sockets = [mockSocketEntry('chat')];
    const handler = createSocketHandler({ sockets, socketBasePath: '/api/ws' });
    const socket = mockSocket();
    handler(mockReq('/api/ws/chat'), socket as Duplex, Buffer.alloc(0));
    expect(socket.destroy).not.toHaveBeenCalled();
  });

  it('strips query string from path when matching', () => {
    const sockets = [mockSocketEntry('notifications')];
    const handler = createSocketHandler({ sockets, socketBasePath: '/api/ws' });
    const socket = mockSocket();
    handler(mockReq('/api/ws/notifications?token=abc'), socket as Duplex, Buffer.alloc(0));
    expect(socket.destroy).not.toHaveBeenCalled();
  });

  it('uses default socketBasePath when not provided', () => {
    const sockets = [mockSocketEntry('chat')];
    const handler = createSocketHandler({ sockets });
    const socket = mockSocket();
    handler(mockReq('/api/ws/chat'), socket as Duplex, Buffer.alloc(0));
    expect(socket.destroy).not.toHaveBeenCalled();
  });

  it('populates shared.sockets when shared app is provided', () => {
    const shared: VitekApp = {
      api: { fetch: vi.fn() },
      sockets: { emit: vi.fn() },
    };
    const sockets = [mockSocketEntry('chat')];
    createSocketHandler({ sockets, socketBasePath: '/api/ws', shared });
    expect(shared.sockets).toBeDefined();
    expect(typeof shared.sockets.emit).toBe('function');
  });

  it('calls logger when provided and connection matches', () => {
    const logger = {
      socketConnected: vi.fn(),
      socketDisconnected: vi.fn(),
      socketMessageReceived: vi.fn(),
      socketMessageEmitted: vi.fn(),
    };
    const sockets = [mockSocketEntry('chat')];
    const handler = createSocketHandler({
      sockets,
      socketBasePath: '/api/ws',
      logger,
    });
    const socket = mockSocket();
    handler(mockReq('/api/ws/chat'), socket as Duplex, Buffer.alloc(0));
    expect(socket.destroy).not.toHaveBeenCalled();
    expect(mockHandleUpgrade).toHaveBeenCalled();
    expect(logger.socketConnected).toHaveBeenCalledWith('/api/ws/chat', 'chat');
  });
});
