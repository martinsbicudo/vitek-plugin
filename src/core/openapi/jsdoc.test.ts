import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { extractMetadataFromFile } from './jsdoc.js';

describe('openapi/jsdoc', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'jsdoc-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {
      // ignore
    }
  });

  it('returns empty object when file has no JSDoc', () => {
    const file = path.join(tmpDir, 'no-jsdoc.ts');
    fs.writeFileSync(file, 'export default function handler() { return {}; }', 'utf-8');
    expect(extractMetadataFromFile(file)).toEqual({});
  });

  it('extracts @summary', () => {
    const file = path.join(tmpDir, 'with-summary.ts');
    fs.writeFileSync(file, `/**
 * @summary Get health status
 */
export default function handler() { return { ok: true }; }
`, 'utf-8');
    expect(extractMetadataFromFile(file).summary).toBe('Get health status');
  });

  it('extracts description from first line when no @summary', () => {
    const file = path.join(tmpDir, 'desc.ts');
    fs.writeFileSync(file, `/**
 * Returns the user by id.
 */
export default function handler() { return {}; }
`, 'utf-8');
    expect(extractMetadataFromFile(file).summary).toBe('Returns the user by id.');
  });

  it('extracts @description', () => {
    const file = path.join(tmpDir, 'with-desc.ts');
    fs.writeFileSync(file, `/**
 * @summary Get user
 * @description Fetches a single user by ID from the database.
 */
export default function handler() { return {}; }
`, 'utf-8');
    const meta = extractMetadataFromFile(file);
    expect(meta.summary).toBe('Get user');
    expect(meta.description).toContain('Fetches a single user');
  });

  it('extracts @tag', () => {
    const file = path.join(tmpDir, 'tags.ts');
    fs.writeFileSync(file, `/**
 * @summary List users
 * @tag users
 * @tag admin
 */
export default function handler() { return []; }
`, 'utf-8');
    expect(extractMetadataFromFile(file).tags).toEqual(['users', 'admin']);
  });

  it('extracts @deprecated', () => {
    const file = path.join(tmpDir, 'deprecated.ts');
    fs.writeFileSync(file, `/**
 * @summary Old endpoint
 * @deprecated Use /v2/health instead
 */
export default function handler() { return {}; }
`, 'utf-8');
    expect(extractMetadataFromFile(file).deprecated).toBe(true);
  });

  it('extracts @param descriptions', () => {
    const file = path.join(tmpDir, 'params.ts');
    fs.writeFileSync(file, `/**
 * @summary Get user by id
 * @param id - The user identifier
 */
export default function handler() { return {}; }
`, 'utf-8');
    expect(extractMetadataFromFile(file).paramDescriptions).toEqual({ id: 'The user identifier' });
  });

  it('extracts @response', () => {
    const file = path.join(tmpDir, 'response.ts');
    fs.writeFileSync(file, `/**
 * @summary Get user
 * @response 200 Success - {User} - {"id":"1","name":"Alice"}
 */
export default function handler() { return {}; }
`, 'utf-8');
    const meta = extractMetadataFromFile(file);
    expect(meta.responses?.['200']).toBeDefined();
    expect(meta.responses!['200'].description).toBe('Success');
    expect(meta.responses!['200'].type).toBe('User');
    expect(meta.responses!['200'].example).toEqual({ id: '1', name: 'Alice' });
  });

  it('extracts @bodyDescription', () => {
    const file = path.join(tmpDir, 'body.ts');
    fs.writeFileSync(file, `/**
 * @summary Create user
 * @bodyDescription JSON with name and email
 */
export default function handler() { return {}; }
`, 'utf-8');
    expect(extractMetadataFromFile(file).bodyDescription).toBe('JSON with name and email');
  });

  it('returns empty object when file does not exist', () => {
    expect(extractMetadataFromFile(path.join(tmpDir, 'missing.ts'))).toEqual({});
  });
});
