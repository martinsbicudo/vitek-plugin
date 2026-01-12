/**
 * Validation logic
 * Core logic - runtime agnostic
 */

import { ValidationError } from '../../shared/errors.js';
import type { ValidationSchema, ValidationResult, ValidationRule } from './types.js';

/**
 * Validates a value against a validation rule
 */
function validateField(
  value: any,
  fieldName: string,
  rule: ValidationRule
): string | null {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return `${fieldName} is required`;
  }

  // If not required and value is empty, skip other validations
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return null;
  }

  // Type validation
  switch (rule.type) {
    case 'string':
      if (typeof value !== 'string') {
        return `${fieldName} must be a string`;
      }
      if (rule.min !== undefined && value.length < rule.min) {
        return `${fieldName} must be at least ${rule.min} characters`;
      }
      if (rule.max !== undefined && value.length > rule.max) {
        return `${fieldName} must be at most ${rule.max} characters`;
      }
      if (rule.pattern) {
        const regex = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern;
        if (!regex.test(value)) {
          return `${fieldName} does not match the required pattern`;
        }
      }
      break;

    case 'number':
      const numValue = typeof value === 'string' ? Number(value) : value;
      if (typeof numValue !== 'number' || isNaN(numValue)) {
        return `${fieldName} must be a number`;
      }
      if (rule.min !== undefined && numValue < rule.min) {
        return `${fieldName} must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && numValue > rule.max) {
        return `${fieldName} must be at most ${rule.max}`;
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        // Try to convert string to boolean
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (lower !== 'true' && lower !== 'false') {
            return `${fieldName} must be a boolean`;
          }
        } else {
          return `${fieldName} must be a boolean`;
        }
      }
      break;

    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return `${fieldName} must be an object`;
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return `${fieldName} must be an array`;
      }
      if (rule.min !== undefined && value.length < rule.min) {
        return `${fieldName} must have at least ${rule.min} items`;
      }
      if (rule.max !== undefined && value.length > rule.max) {
        return `${fieldName} must have at most ${rule.max} items`;
      }
      break;
  }

  // Custom validation
  if (rule.custom) {
    const customResult = rule.custom(value);
    if (customResult !== true) {
      return typeof customResult === 'string' ? customResult : `${fieldName} is invalid`;
    }
  }

  return null;
}

/**
 * Validates an object against a validation schema
 */
export function validate(
  data: any,
  schema: ValidationSchema
): ValidationResult {
  const errors: Record<string, string[]> = {};

  for (const [fieldName, rule] of Object.entries(schema)) {
    const value = data?.[fieldName];
    const error = validateField(value, fieldName, rule);
    
    if (error) {
      if (!errors[fieldName]) {
        errors[fieldName] = [];
      }
      errors[fieldName].push(error);
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

/**
 * Validates and throws ValidationError if invalid
 */
export function validateOrThrow(data: any, schema: ValidationSchema): void {
  const result = validate(data, schema);
  if (!result.valid) {
    throw new ValidationError('Validation failed', result.errors);
  }
}

/**
 * Validates body parameters
 */
export function validateBody(body: any, schema: ValidationSchema): any {
  validateOrThrow(body, schema);
  return body;
}

/**
 * Validates query parameters
 */
export function validateQuery(query: any, schema: ValidationSchema): any {
  validateOrThrow(query, schema);
  return query;
}
