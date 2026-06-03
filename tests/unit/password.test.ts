import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '../../src/lib/password.js';

describe('password hashing', () => {
  it('round-trips a bcrypt hash', async () => {
    const hash = await hashPassword('s3cret-pass');
    expect(hash).not.toBe('s3cret-pass');
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(await verifyPassword('s3cret-pass', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('falls back to plaintext compare for legacy non-bcrypt values', async () => {
    expect(await verifyPassword('legacy', 'legacy')).toBe(true);
    expect(await verifyPassword('legacy', 'other')).toBe(false);
  });
});
