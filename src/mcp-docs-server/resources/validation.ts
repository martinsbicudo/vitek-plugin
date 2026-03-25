export const VALIDATION_URI = 'vitek://docs/validation';

export const VALIDATION_CONTENT = `# Vitek – Request validation

Optional runtime validation for body and query via helpers.

## Helpers

- \`validateBody(body, schema)\` – validates request body; throws ValidationError (422) if invalid
- \`validateQuery(query, schema)\` – validates query params
- \`validate(data, schema)\` – returns result without throwing
- \`validateOrThrow(data, schema)\` – throws ValidationError if invalid

## ValidationRule (per field)

\`type\`: "string" | "number" | "boolean" | "object" | "array"
\`required?\`, \`min?\`, \`max?\`, \`pattern?\` (string or RegExp), \`custom?\` (value => boolean | string)

## Example

\`\`\`typescript
import { validateBody, validateQuery } from "vitek-plugin";
import type { VitekContext } from "vitek-plugin";

export default function handler(context: VitekContext) {
  const body = validateBody(context.body, {
    title: { type: "string", required: true, min: 1, max: 200 },
    authorId: { type: "number", required: true, min: 1 },
  });
  const query = validateQuery(context.query, {
    limit: { type: "number", min: 1, max: 100 },
  });
  return { body, query };
}
\`\`\`

Plugin option \`enableValidation: true\` enables automatic validation; manual helpers are always available.
`;
