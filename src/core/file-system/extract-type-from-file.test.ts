import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  extractBodyTypeFromFile,
  extractQueryTypeFromFile,
  extractTypeFromFile,
} from './extract-type-from-file.js';

describe('extract-type-from-file', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'extract-type-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {
      //
    }
  });

  describe('extractBodyTypeFromFile', () => {
    it('returns Body type from export type Body', () => {
      const file = path.join(tmpDir, 'route.post.ts');
      fs.writeFileSync(
        file,
        `export type Body = {
  email: string;
  name?: string;
};
export default async function handler() {}`,
        'utf-8'
      );
      expect(extractBodyTypeFromFile(file)).toBe(`{
  email: string;
  name?: string;
}`);
    });

    it('returns Body type from export interface Body', () => {
      const file = path.join(tmpDir, 'route.post.ts');
      fs.writeFileSync(
        file,
        `export interface Body {
  title: string;
}
export default async function handler() {}`,
        'utf-8'
      );
      expect(extractBodyTypeFromFile(file)).toBe(`{ title: string; }`);
    });

    it('returns undefined when Body is not exported', () => {
      const file = path.join(tmpDir, 'route.post.ts');
      fs.writeFileSync(file, 'export default async function handler() {}', 'utf-8');
      expect(extractBodyTypeFromFile(file)).toBeUndefined();
    });

    it('returns undefined for non-existent file', () => {
      expect(extractBodyTypeFromFile(path.join(tmpDir, 'nonexistent.ts'))).toBeUndefined();
    });
  });

  describe('extractQueryTypeFromFile', () => {
    it('returns Query type from export type Query', () => {
      const file = path.join(tmpDir, 'route.get.ts');
      fs.writeFileSync(
        file,
        `export type Query = {
  limit?: number;
  offset?: number;
};
export default async function handler() {}`,
        'utf-8'
      );
      expect(extractQueryTypeFromFile(file)).toBe(`{
  limit?: number;
  offset?: number;
}`);
    });

    it('returns undefined when Query is not exported', () => {
      const file = path.join(tmpDir, 'route.get.ts');
      fs.writeFileSync(file, 'export default async function handler() {}', 'utf-8');
      expect(extractQueryTypeFromFile(file)).toBeUndefined();
    });
  });

  describe('extractTypeFromFile', () => {
    it('returns type with primitive alias', () => {
      const file = path.join(tmpDir, 'route.post.ts');
      fs.writeFileSync(
        file,
        `export type Body = string;
export default async function handler() {}`,
        'utf-8'
      );
      expect(extractTypeFromFile(file, 'Body')).toBe('string');
    });
  });
});
