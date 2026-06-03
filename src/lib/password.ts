import { timingSafeEqual } from 'node:crypto';

import bcrypt from 'bcryptjs';

import { env } from '../config/env.js';

/** Bcrypt hash prefixes (any of the `$2x$` variants). */
const BCRYPT_PREFIX = /^\$2[aby]\$/;

/** Hashes a plaintext password with bcrypt using the configured cost. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

/** Constant-time string comparison that tolerates length differences. */
function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to keep timing roughly constant, then fail.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verifies a supplied password against the stored value.
 *
 * In `bcrypt` mode (default) a bcrypt-hashed value is verified with bcrypt,
 * while a legacy plaintext value falls back to a constant-time compare. In
 * `plain` mode comparison is always constant-time plaintext. This lets the
 * service work against an inherited dataset that may still hold plaintext.
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (env.PASSWORD_HASH_MODE === 'plain') {
    return constantTimeEquals(plain, stored);
  }
  if (BCRYPT_PREFIX.test(stored)) {
    return bcrypt.compare(plain, stored);
  }
  return constantTimeEquals(plain, stored);
}
