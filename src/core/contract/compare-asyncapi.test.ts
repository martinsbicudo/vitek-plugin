import { describe, it, expect } from 'vitest';
import { compareAsyncApiSpecs } from './compare-asyncapi.js';

const minimalAsync = (channels: Record<string, unknown>) => ({
  asyncapi: '2.4.0',
  info: { title: 't', version: '1' },
  servers: {},
  channels,
});

describe('compareAsyncApiSpecs', () => {
  it('detects missing channel', () => {
    const base = minimalAsync({ '/api/ws/a': { description: 'd' } });
    const cur = minimalAsync({});
    const issues = compareAsyncApiSpecs(base, cur);
    expect(issues.some((i) => i.code === 'asyncapi_missing_channel')).toBe(true);
  });

  it('detects new channel as warning', () => {
    const base = minimalAsync({});
    const cur = minimalAsync({ '/api/ws/x': { description: 'd' } });
    const issues = compareAsyncApiSpecs(base, cur);
    expect(issues.some((i) => i.code === 'asyncapi_new_channel')).toBe(true);
  });
});
