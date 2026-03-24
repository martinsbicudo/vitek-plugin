import { describe, it, expect } from 'vitest';
import { sanitizeIncomingRequestId, readRequestIdFromHeaders, getOrCreateRequestId } from './correlation.js';

describe('sanitizeIncomingRequestId', () => {
  it('accepts alphanumeric and hyphen', () => {
    expect(sanitizeIncomingRequestId('abc-123-XYZ')).toBe('abc-123-XYZ');
  });

  it('rejects empty and invalid characters', () => {
    expect(sanitizeIncomingRequestId('')).toBeNull();
    expect(sanitizeIncomingRequestId('a b')).toBeNull();
    expect(sanitizeIncomingRequestId('a/b')).toBeNull();
    expect(sanitizeIncomingRequestId(undefined)).toBeNull();
  });

  it('trims and caps length', () => {
    expect(sanitizeIncomingRequestId('  ok-1  ')).toBe('ok-1');
    const long = 'a'.repeat(200);
    expect(sanitizeIncomingRequestId(long)?.length).toBe(128);
  });
});

describe('readRequestIdFromHeaders', () => {
  it('reads x-request-id', () => {
    expect(readRequestIdFromHeaders({ 'x-request-id': 'req-1' })).toBe('req-1');
  });

  it('uses first element when array', () => {
    expect(readRequestIdFromHeaders({ 'x-request-id': ['first', 'second'] })).toBe('first');
  });
});

describe('getOrCreateRequestId', () => {
  it('generates uuid when header missing', () => {
    const id = getOrCreateRequestId({});
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('reuses valid incoming id', () => {
    expect(getOrCreateRequestId({ 'x-request-id': 'client-trace-9' })).toBe('client-trace-9');
  });
});
