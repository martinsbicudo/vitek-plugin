import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  generateAsyncApiSpec,
  generateAsyncApiFile,
} from './generate.js';
import type { SocketForDocs } from './generate.js';

function socket(pattern: string): SocketForDocs {
  return { pattern };
}

describe('generateAsyncApiSpec', () => {
  it('returns valid AsyncAPI 2.x spec with empty sockets', () => {
    const spec = generateAsyncApiSpec([], '/ws', {}) as Record<string, unknown>;
    expect(spec.asyncapi).toBe('2.4.0');
    expect(spec.info).toEqual({
      title: 'Vitek WebSocket API',
      version: '1.0.0',
      description: 'WebSocket endpoints (auto-generated from socket routes)',
    });
    expect(spec.channels).toEqual({});
    expect(spec.servers).toBeDefined();
    expect((spec.servers as Record<string, unknown>).development).toBeDefined();
  });

  it('uses custom info when provided', () => {
    const spec = generateAsyncApiSpec([], '/ws', {
      info: {
        title: 'My WebSocket API',
        version: '2.0.0',
        description: 'Custom WS API',
      },
    }) as Record<string, unknown>;
    expect(spec.info).toEqual({
      title: 'My WebSocket API',
      version: '2.0.0',
      description: 'Custom WS API',
    });
  });

  it('uses custom serverUrl when provided', () => {
    const spec = generateAsyncApiSpec([], '/ws', {
      serverUrl: 'wss://api.example.com/ws',
    }) as Record<string, unknown>;
    const servers = spec.servers as Record<string, unknown>;
    const dev = servers.development as Record<string, unknown>;
    expect(dev.url).toBe('wss://api.example.com/ws');
    expect(dev.protocol).toBe('wss');
  });

  it('default serverUrl uses ws protocol', () => {
    const spec = generateAsyncApiSpec([], '/ws', {}) as Record<string, unknown>;
    const servers = spec.servers as Record<string, unknown>;
    const dev = servers.development as Record<string, unknown>;
    expect(dev.url).toBe('ws://localhost:5173');
    expect(dev.protocol).toBe('ws');
  });

  it('generates channel for root socket pattern', () => {
    const sockets = [socket('')];
    const spec = generateAsyncApiSpec(sockets, '/ws', {}) as Record<string, unknown>;
    const channels = spec.channels as Record<string, unknown>;
    expect(channels['/ws']).toBeDefined();
    const channel = channels['/ws'] as Record<string, unknown>;
    expect(channel.description).toContain('Root WebSocket');
    expect(channel.subscribe).toBeDefined();
    expect(channel.publish).toBeDefined();
  });

  it('generates channel for path socket pattern', () => {
    const sockets = [socket('notifications')];
    const spec = generateAsyncApiSpec(sockets, '/ws', {}) as Record<string, unknown>;
    const channels = spec.channels as Record<string, unknown>;
    expect(channels['/ws/notifications']).toBeDefined();
    const channel = channels['/ws/notifications'] as Record<string, unknown>;
    expect(channel.description).toContain('WebSocket');
    expect((channel.subscribe as Record<string, unknown>).operationId).toContain('onMessage');
    expect((channel.publish as Record<string, unknown>).operationId).toContain('send');
  });

  it('generates multiple channels for multiple sockets', () => {
    const sockets = [socket('chat'), socket('notifications'), socket('')];
    const spec = generateAsyncApiSpec(sockets, '/ws', {}) as Record<string, unknown>;
    const channels = spec.channels as Record<string, unknown>;
    expect(Object.keys(channels)).toHaveLength(3);
    expect(channels['/ws/chat']).toBeDefined();
    expect(channels['/ws/notifications']).toBeDefined();
    expect(channels['/ws']).toBeDefined();
  });

  it('channel subscribe and publish have message payload schema', () => {
    const sockets = [socket('events')];
    const spec = generateAsyncApiSpec(sockets, '/ws', {}) as Record<string, unknown>;
    const channel = (spec.channels as Record<string, unknown>)['/ws/events'] as Record<string, unknown>;
    const sub = channel.subscribe as Record<string, unknown>;
    const subMsg = (sub.message as Record<string, unknown>).payload as Record<string, unknown>;
    expect(subMsg.type).toBe('object');
    const pub = channel.publish as Record<string, unknown>;
    const pubMsg = (pub.message as Record<string, unknown>).payload as Record<string, unknown>;
    expect(pubMsg.type).toBe('object');
  });
});

describe('generateAsyncApiFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'asyncapi-gen-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {
      //
    }
  });

  it('writes valid JSON spec to file', async () => {
    const outputPath = path.join(tmpDir, 'asyncapi.json');
    const sockets = [socket('chat')];
    await generateAsyncApiFile(outputPath, sockets, '/ws', {});
    expect(fs.existsSync(outputPath)).toBe(true);
    const content = fs.readFileSync(outputPath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.asyncapi).toBe('2.4.0');
    expect(parsed.channels['/ws/chat']).toBeDefined();
  });

  it('creates directory if it does not exist', async () => {
    const outputPath = path.join(tmpDir, 'nested', 'dir', 'asyncapi.json');
    await generateAsyncApiFile(outputPath, [], '/ws', {});
    expect(fs.existsSync(outputPath)).toBe(true);
  });
});
