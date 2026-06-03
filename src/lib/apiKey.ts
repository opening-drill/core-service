import { timingSafeEqual } from 'node:crypto';

import { env } from '../config/env.js';

/** True when `API_KEY` is set in the environment. */
export function isApiKeyConfigured(): boolean {
  return env.API_KEY !== undefined;
}

/** Compares a provided key to `API_KEY` (constant-time). */
export function isApiKeyValid(provided: string): boolean {
  const expected = env.API_KEY;
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
