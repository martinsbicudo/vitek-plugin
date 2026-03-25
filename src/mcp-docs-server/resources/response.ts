export const RESPONSE_URI = 'vitek://docs/response';

export const RESPONSE_CONTENT = `# Vitek – Response handling

Return a plain object for 200 JSON, or use response helpers for status and headers.

## Helpers (from vitek-plugin)

- \`ok(body?, headers?)\` – 200
- \`created(body?, headers?)\` – 201
- \`noContent(headers?)\` – 204
- \`badRequest(body?, headers?)\` – 400
- \`unauthorized(body?, headers?)\` – 401
- \`forbidden(body?, headers?)\` – 403
- \`notFound(body?, headers?)\` – 404
- \`conflict(body?, headers?)\` – 409
- \`unprocessableEntity(body?, headers?)\` – 422
- \`tooManyRequests(body?, headers?)\` – 429
- \`internalServerError(body?, headers?)\` – 500
- \`redirect(url, permanent?, preserveMethod?)\` – 301/302/307/308
- \`json(body, { status?, headers? })\` – custom status/headers
- \`text(body: string, status?)\` – plain text
- \`html(body: string, status?)\` – HTML

## VitekResponse

Return \`{ status?, headers?, body? }\` for full control (e.g. streaming, custom headers).

## Example

\`\`\`typescript
import { created, notFound, json } from "vitek-plugin";
import type { VitekContext } from "vitek-plugin";

export default function handler(context: VitekContext) {
  if (!context.params.id) return notFound({ error: "Not found" });
  return created({ id: context.params.id });
}
\`\`\`
`;
