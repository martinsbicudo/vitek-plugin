# Request Validation

Vitek provides optional runtime validation for request body and query parameters via helpers.

## Manual Validation

Use `validateBody` and `validateQuery` in your handlers. If validation fails, a `ValidationError` (422) is thrown:

```typescript
import { validateBody, validateQuery } from "vitek-plugin/validation";
import type { ValidationSchema } from "vitek-plugin/validation";

export type Body = {
  title: string;
  content: string;
  authorId: number;
};

export default function handler(context: VitekContext) {
  const body = validateBody(context.body, {
    title: { type: "string", required: true, min: 1, max: 200 },
    content: { type: "string", required: true, min: 10 },
    authorId: { type: "number", required: true, min: 1 },
  });

  const query = validateQuery(context.query, {
    limit: { type: "number", min: 1, max: 100 },
    offset: { type: "number", min: 0 },
  });

  return { message: "Validated successfully", body, query };
}
```

## Validation Rules

Each field in the schema uses a `ValidationRule`:

```typescript
type ValidationRule = {
  type: "string" | "number" | "boolean" | "object" | "array";
  required?: boolean;
  min?: number;   // For strings: min length; for numbers: min value; for arrays: min items
  max?: number;   // For strings: max length; for numbers: max value; for arrays: max items
  pattern?: string | RegExp;  // For strings: regex pattern
  custom?: (value: any) => boolean | string;  // Custom validator
};
```

## Validation Functions

- **`validate(data, schema)`** - Returns validation result without throwing
- **`validateOrThrow(data, schema)`** - Throws `ValidationError` if invalid
- **`validateBody(body, schema)`** - Validates request body
- **`validateQuery(query, schema)`** - Validates query parameters
