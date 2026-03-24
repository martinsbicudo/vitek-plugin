import { describe, it, expect } from 'vitest';
import { compareOpenApiSpecs } from './compare-openapi.js';

const minimalSpec = (paths: Record<string, unknown>) => ({
  openapi: '3.0.3',
  info: { title: 't', version: '1' },
  paths,
  components: { schemas: {} },
});

describe('compareOpenApiSpecs', () => {
  it('detects missing path', () => {
    const base = minimalSpec({
      '/a': { get: { responses: { '200': { description: 'ok' } } } },
    });
    const cur = minimalSpec({});
    const issues = compareOpenApiSpecs(base, cur);
    expect(issues.some((i) => i.code === 'missing_path')).toBe(true);
  });

  it('detects missing method', () => {
    const base = minimalSpec({
      '/a': {
        get: { responses: { '200': { description: 'ok' } } },
        post: { responses: { '200': { description: 'ok' } } },
      },
    });
    const cur = minimalSpec({
      '/a': { get: { responses: { '200': { description: 'ok' } } } },
    });
    const issues = compareOpenApiSpecs(base, cur);
    expect(issues.some((i) => i.code === 'missing_method')).toBe(true);
  });

  it('detects undocumented operation as warning', () => {
    const base = minimalSpec({
      '/a': { get: { responses: { '200': { description: 'ok' } } } },
    });
    const cur = minimalSpec({
      '/a': { get: { responses: { '200': { description: 'ok' } } } },
      '/b': { get: { responses: { '200': { description: 'ok' } } } },
    });
    const issues = compareOpenApiSpecs(base, cur);
    const w = issues.filter((i) => i.code === 'undocumented_operation');
    expect(w.length).toBe(1);
    expect(w[0].severity).toBe('warning');
  });

  it('detects missing response status', () => {
    const base = minimalSpec({
      '/a': {
        get: {
          responses: {
            '200': { description: 'ok' },
            '404': { description: 'nf' },
          },
        },
      },
    });
    const cur = minimalSpec({
      '/a': { get: { responses: { '200': { description: 'ok' } } } },
    });
    const issues = compareOpenApiSpecs(base, cur);
    expect(issues.some((i) => i.code === 'missing_response_status')).toBe(true);
  });

  it('detects response schema mismatch', () => {
    const base = minimalSpec({
      '/a': {
        get: {
          responses: {
            '200': {
              description: 'ok',
              content: { 'application/json': { schema: { type: 'object', properties: { x: { type: 'string' } } } } },
            },
          },
        },
      },
    });
    const cur = minimalSpec({
      '/a': {
        get: {
          responses: {
            '200': {
              description: 'ok',
              content: { 'application/json': { schema: { type: 'object', properties: { y: { type: 'string' } } } } },
            },
          },
        },
      },
    });
    const issues = compareOpenApiSpecs(base, cur);
    expect(issues.some((i) => i.code === 'response_schema_mismatch')).toBe(true);
  });

  it('returns no issues when specs match structurally', () => {
    const spec = minimalSpec({
      '/a': { get: { responses: { '200': { description: 'ok', content: { 'application/json': { schema: { type: 'string' } } } } } } },
    });
    expect(compareOpenApiSpecs(spec, spec)).toEqual([]);
  });
});
