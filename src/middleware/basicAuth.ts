import type { RequestHandler } from 'express';

import { prisma } from '../lib/prisma.js';
import { verifyPassword } from '../lib/password.js';
import { HttpError } from './errorHandler.js';

/**
 * HTTP Basic identity middleware.
 *
 * Parses `Authorization: Basic`, resolves the active user by username, verifies
 * the password, and attaches `req.user` (without the password). Any failure
 * results in 401 with a `WWW-Authenticate: Basic` challenge.
 */
function unauthorized(message: string): HttpError {
  return new HttpError(401, message, undefined, 'Unauthorized');
}

function parseBasicHeader(header: string | undefined): { username: string; password: string } {
  if (!header || !header.startsWith('Basic ')) {
    throw unauthorized('Missing or malformed Authorization header');
  }
  const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator === -1) {
    throw unauthorized('Malformed Basic credentials');
  }
  return {
    username: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
}

export const basicAuth: RequestHandler = (req, res, next) => {
  void (async () => {
    try {
      const { username, password } = parseBasicHeader(req.header('authorization'));

      const user = await prisma.user.findFirst({
        where: { username, delete_date: null },
        select: { id: true, username: true, full_name: true, password: true },
      });

      if (!user || !(await verifyPassword(password, user.password))) {
        throw unauthorized('Invalid credentials');
      }

      req.user = { id: user.id, username: user.username, full_name: user.full_name };
      next();
    } catch (err) {
      if (err instanceof HttpError && err.statusCode === 401) {
        res.setHeader('WWW-Authenticate', 'Basic realm="core-service"');
      }
      next(err);
    }
  })();
};
