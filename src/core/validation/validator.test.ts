import { describe, it, expect } from 'vitest';
import {
  validate,
  validateOrThrow,
  validateBody,
  validateQuery,
} from './validator.js';
import { ValidationError } from '../../shared/errors.js';
import type { ValidationSchema } from './types.js';

describe('validate', () => {
  describe('required', () => {
    it('returns error when required field is missing', () => {
      const schema: ValidationSchema = {
        name: { type: 'string', required: true },
      };
      expect(validate({}, schema)).toEqual({
        valid: false,
        errors: { name: ['name is required'] },
      });
    });

    it('returns error when required field is null or empty string', () => {
      const schema: ValidationSchema = {
        name: { type: 'string', required: true },
      };
      expect(validate({ name: null }, schema).valid).toBe(false);
      expect(validate({ name: '' }, schema).valid).toBe(false);
    });

    it('passes when required field is present', () => {
      const schema: ValidationSchema = {
        name: { type: 'string', required: true },
      };
      expect(validate({ name: 'ok' }, schema)).toEqual({ valid: true });
    });
  });

  describe('string', () => {
    it('returns error when value is not string', () => {
      const schema: ValidationSchema = { name: { type: 'string' } };
      expect(validate({ name: 123 }, schema).valid).toBe(false);
      expect(validate({ name: 123 }, schema).errors?.name?.[0]).toContain('must be a string');
    });

    it('enforces min length', () => {
      const schema: ValidationSchema = { name: { type: 'string', min: 3 } };
      expect(validate({ name: 'ab' }, schema).valid).toBe(false);
      expect(validate({ name: 'abc' }, schema).valid).toBe(true);
    });

    it('enforces max length', () => {
      const schema: ValidationSchema = { name: { type: 'string', max: 5 } };
      expect(validate({ name: 'abcdef' }, schema).valid).toBe(false);
      expect(validate({ name: 'abcde' }, schema).valid).toBe(true);
    });

    it('enforces pattern (string regex)', () => {
      const schema: ValidationSchema = { code: { type: 'string', pattern: '^[A-Z]+$' } };
      expect(validate({ code: 'abc' }, schema).valid).toBe(false);
      expect(validate({ code: 'ABC' }, schema).valid).toBe(true);
    });

    it('enforces pattern (RegExp)', () => {
      const schema: ValidationSchema = { code: { type: 'string', pattern: /^\d+$/ } };
      expect(validate({ code: '12a' }, schema).valid).toBe(false);
      expect(validate({ code: '123' }, schema).valid).toBe(true);
    });

    it('skips other validations when optional and empty', () => {
      const schema: ValidationSchema = { name: { type: 'string' } };
      expect(validate({}, schema)).toEqual({ valid: true });
      expect(validate({ name: undefined }, schema)).toEqual({ valid: true });
    });
  });

  describe('number', () => {
    it('returns error when value is not a number', () => {
      const schema: ValidationSchema = { age: { type: 'number' } };
      expect(validate({ age: 'not a number' }, schema).valid).toBe(false);
    });

    it('accepts string that parses to number', () => {
      const schema: ValidationSchema = { age: { type: 'number' } };
      expect(validate({ age: '42' }, schema).valid).toBe(true);
    });

    it('enforces min/max', () => {
      const schema: ValidationSchema = { age: { type: 'number', min: 0, max: 120 } };
      expect(validate({ age: -1 }, schema).valid).toBe(false);
      expect(validate({ age: 121 }, schema).valid).toBe(false);
      expect(validate({ age: 25 }, schema).valid).toBe(true);
    });
  });

  describe('boolean', () => {
    it('accepts boolean', () => {
      const schema: ValidationSchema = { active: { type: 'boolean' } };
      expect(validate({ active: true }, schema).valid).toBe(true);
      expect(validate({ active: false }, schema).valid).toBe(true);
    });

    it('accepts string "true" and "false"', () => {
      const schema: ValidationSchema = { active: { type: 'boolean' } };
      expect(validate({ active: 'true' }, schema).valid).toBe(true);
      expect(validate({ active: 'false' }, schema).valid).toBe(true);
    });

    it('returns error for invalid string', () => {
      const schema: ValidationSchema = { active: { type: 'boolean' } };
      expect(validate({ active: 'yes' }, schema).valid).toBe(false);
    });

    it('returns error for non-boolean non-string', () => {
      const schema: ValidationSchema = { active: { type: 'boolean' } };
      expect(validate({ active: 1 }, schema).valid).toBe(false);
    });
  });

  describe('object', () => {
    it('accepts plain object', () => {
      const schema: ValidationSchema = { payload: { type: 'object' } };
      expect(validate({ payload: {} }, schema).valid).toBe(true);
      expect(validate({ payload: { a: 1 } }, schema).valid).toBe(true);
    });

    it('returns error for null, array, or primitive', () => {
      const schema: ValidationSchema = { payload: { type: 'object', required: true } };
      expect(validate({ payload: null }, schema).valid).toBe(false);
      expect(validate({ payload: [] }, schema).valid).toBe(false);
      expect(validate({ payload: 'x' }, schema).valid).toBe(false);
    });
  });

  describe('array', () => {
    it('accepts array', () => {
      const schema: ValidationSchema = { ids: { type: 'array' } };
      expect(validate({ ids: [] }, schema).valid).toBe(true);
      expect(validate({ ids: [1, 2] }, schema).valid).toBe(true);
    });

    it('returns error for non-array', () => {
      const schema: ValidationSchema = { ids: { type: 'array' } };
      expect(validate({ ids: {} }, schema).valid).toBe(false);
    });

    it('enforces min/max length', () => {
      const schema: ValidationSchema = { ids: { type: 'array', min: 1, max: 3 } };
      expect(validate({ ids: [] }, schema).valid).toBe(false);
      expect(validate({ ids: [1, 2, 3, 4] }, schema).valid).toBe(false);
      expect(validate({ ids: [1, 2] }, schema).valid).toBe(true);
    });
  });

  describe('custom', () => {
    it('calls custom validator and uses string result as error', () => {
      const schema: ValidationSchema = {
        value: {
          type: 'string',
          custom: (v) => (v === 'ok' ? true : 'must be "ok"'),
        },
      };
      expect(validate({ value: 'ok' }, schema).valid).toBe(true);
      expect(validate({ value: 'nope' }, schema)).toEqual({
        valid: false,
        errors: { value: ['must be "ok"'] },
      });
    });

    it('uses generic message when custom returns false', () => {
      const schema: ValidationSchema = {
        value: { type: 'string', custom: () => false },
      };
      expect(validate({ value: 'x' }, schema).errors?.value?.[0]).toBe('value is invalid');
    });
  });

  describe('multiple fields', () => {
    it('collects all field errors', () => {
      const schema: ValidationSchema = {
        name: { type: 'string', required: true },
        age: { type: 'number', min: 0 },
      };
      const result = validate({ age: -1 }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors?.name).toBeDefined();
      expect(result.errors?.age).toBeDefined();
    });
  });
});

describe('validateOrThrow', () => {
  it('does not throw when valid', () => {
    const schema: ValidationSchema = { name: { type: 'string' } };
    expect(() => validateOrThrow({ name: 'x' }, schema)).not.toThrow();
  });

  it('throws ValidationError with errors when invalid', () => {
    const schema: ValidationSchema = { name: { type: 'string', required: true } };
    expect(() => validateOrThrow({}, schema)).toThrow(ValidationError);
    try {
      validateOrThrow({}, schema);
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).errors).toEqual({ name: ['name is required'] });
    }
  });
});

describe('validateBody', () => {
  it('returns body when valid', () => {
    const schema: ValidationSchema = { title: { type: 'string' } };
    const body = { title: 'Hello' };
    expect(validateBody(body, schema)).toBe(body);
  });

  it('throws when invalid', () => {
    const schema: ValidationSchema = { title: { type: 'string', required: true } };
    expect(() => validateBody({}, schema)).toThrow(ValidationError);
  });
});

describe('validateQuery', () => {
  it('returns query when valid', () => {
    const schema: ValidationSchema = { page: { type: 'number' } };
    const query = { page: '1' };
    expect(validateQuery(query, schema)).toBe(query);
  });

  it('throws when invalid', () => {
    const schema: ValidationSchema = { page: { type: 'number', min: 1 } };
    expect(() => validateQuery({ page: '0' }, schema)).toThrow(ValidationError);
  });
});
