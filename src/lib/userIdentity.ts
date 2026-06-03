/**
 * user_id ↔ username resolution.
 *
 * The live-data contract treats `user_id` as an opaque string (e.g.
 * `1234567@idf.il`), which maps to our unique `User.username`. Internally the
 * primary key / foreign keys remain UUIDs, so the API boundary resolves a
 * contract `user_id` (username) to the internal `User.id` for writes and reads.
 * The reverse direction needs no DB call — queries that need the username simply
 * `include` the `user` relation.
 */
import { prisma } from './prisma.js';
import { HttpError } from '../middleware/errorHandler.js';

/**
 * Resolves a contract `user_id` (username) to the internal `User.id` (UUID).
 * Throws 404 if no active user has that username.
 */
export async function resolveUsernameToId(username: string): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { username, delete_date: null },
    select: { id: true },
  });
  if (!user) throw new HttpError(404, `User ${username} not found`, undefined, 'NOT_FOUND');
  return user.id;
}
