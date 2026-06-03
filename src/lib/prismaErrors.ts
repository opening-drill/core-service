import { Prisma } from '@prisma/client';

import { HttpError } from '../middleware/errorHandler.js';

/**
 * Maps known Prisma engine errors to `HttpError`s so services can let DB
 * constraint violations bubble up as clean 4xx responses:
 *
 * - `P2002` unique constraint  → 409 Conflict
 * - `P2003` foreign-key restrict→ 409 Conflict
 * - `P2025` record not found    → 404 NotFound
 *
 * Anything else is returned unchanged for the central handler to treat as 500.
 *
 * @param messages Optional per-code message overrides.
 */
export function mapPrismaError(
  err: unknown,
  messages?: { conflict?: string; notFound?: string },
): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return new HttpError(409, messages?.conflict ?? 'Resource already exists', undefined, 'Conflict');
      case 'P2003':
        return new HttpError(
          409,
          messages?.conflict ?? 'Cannot complete: referenced by or missing a related record',
          undefined,
          'Conflict',
        );
      case 'P2025':
        return new HttpError(404, messages?.notFound ?? 'Resource not found', undefined, 'NotFound');
      default:
        return err;
    }
  }
  return err;
}

/**
 * Convenience wrapper: runs `fn`, and on a known Prisma error rethrows the
 * mapped `HttpError`. Use around `delete`/`create`/`update` calls whose
 * constraint violations should become 404/409.
 */
export async function withPrismaErrors<T>(
  fn: () => Promise<T>,
  messages?: { conflict?: string; notFound?: string },
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw mapPrismaError(err, messages);
  }
}
