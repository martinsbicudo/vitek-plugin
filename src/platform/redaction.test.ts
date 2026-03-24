import { describe, it, expect } from 'vitest';
import { REDACTED_VALUE, redactHeaders, redactObject } from './redaction.js';
import type { RedactionPolicy } from './config.js';

const policy: RedactionPolicy = {
  stripHeaders: ['authorization', 'cookie'],
  stripFields: ['password', 'token', 'secret'],
};

describe('redactHeaders', () => {
  it('redacts configured headers case-insensitively', () => {
    const out = redactHeaders(
      {
        Authorization: 'Bearer abc',
        cookie: 'session=1',
        'x-request-id': 'req-1',
      },
      policy
    );
    expect(out.Authorization).toBe(REDACTED_VALUE);
    expect(out.cookie).toBe(REDACTED_VALUE);
    expect(out['x-request-id']).toBe('req-1');
  });
});

describe('redactObject', () => {
  it('redacts configured fields recursively', () => {
    const input = {
      user: {
        name: 'a',
        password: 'p',
        nested: { token: 't' },
      },
      items: [{ secret: 's1' }, { value: 2 }],
    };
    const out = redactObject(input, policy);
    expect(out.user.password).toBe(REDACTED_VALUE);
    expect(out.user.nested.token).toBe(REDACTED_VALUE);
    expect(out.items[0].secret).toBe(REDACTED_VALUE);
    expect(out.items[1].value).toBe(2);
  });
});
