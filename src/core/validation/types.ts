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
  pattern?: string | RegExp;
  custom?: (value: any) => boolean | string; // Returns true if valid, or error message if invalid
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
