import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

const MAX_REQUEST_ID_LENGTH = 128;
const REQUEST_ID_PATTERN = /^[a-zA-Z0-9-]+$/;

export function sanitizeIncomingRequestId(raw: string | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null;
  const trimmed = raw.trim().slice(0, MAX_REQUEST_ID_LENGTH);
  if (trimmed.length === 0 || !REQUEST_ID_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export function readRequestIdFromHeaders(headers: IncomingMessage['headers']): string | null {
  const v = headers['x-request-id'];
  const s = Array.isArray(v) ? v[0] : v;
  return sanitizeIncomingRequestId(s);
}

export function getOrCreateRequestId(headers: IncomingMessage['headers']): string {
  return readRequestIdFromHeaders(headers) ?? randomUUID();
}
