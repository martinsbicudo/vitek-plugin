/**
 * Validation types
 * Core logic - runtime agnostic
 */

/**
 * Validation rule for a field
 */
export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  min?: number;
  max?: number;
  /** String is compiled with new RegExp(pattern). Avoid complex or user-supplied patterns (ReDoS risk). Prefer allowlists or simple character classes. */
  pattern?: string | RegExp;
  custom?: (value: any) => boolean | string;
}

/**
 * Validation schema for body or query parameters
 */
export type ValidationSchema = Record<string, ValidationRule>;

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string[]>;
}
