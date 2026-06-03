import { PermissionType } from '@prisma/client';
import type { RequestHandler } from 'express';

import { prisma } from '../lib/prisma.js';
import { HttpError } from './errorHandler.js';

/**
 * RBAC permission guard.
 *
 * `authorize(permission)` resolves the authenticated user's effective
 * permissions (active `user_role` → active `role` → active `role_permission` →
 * active `permission`) and enforces that `permission` is granted, returning 403
 * otherwise. Must run after `basicAuth`.
 */

/** Loads the set of permissions effectively granted to a user. */
export async function loadUserPermissions(userId: string): Promise<Set<PermissionType>> {
  const assignments = await prisma.userRole.findMany({
    where: {
      user_id: userId,
      delete_date: null,
      role: { delete_date: null },
    },
    select: {
      role: {
        select: {
          role_permissions: {
            where: { delete_date: null, permission_ref: { delete_date: null } },
            select: { permission: true },
          },
        },
      },
    },
  });

  const permissions = new Set<PermissionType>();
  for (const assignment of assignments) {
    for (const rp of assignment.role.role_permissions) {
      permissions.add(rp.permission);
    }
  }
  return permissions;
}

export function authorize(required: PermissionType): RequestHandler {
  return (req, res, next) => {
    void (async () => {
      try {
        if (!req.user) {
          throw new HttpError(401, 'Authentication required', undefined, 'Unauthorized');
        }
        const granted = await loadUserPermissions(req.user.id);
        if (!granted.has(required)) {
          throw new HttpError(
            403,
            `Missing required permission: ${required}`,
            { required },
            'Forbidden',
          );
        }
        next();
      } catch (err) {
        next(err);
      }
    })();
  };
}

/** Guard for read endpoints. */
export const requireView = authorize(PermissionType.VIEW);
/** Guard for write endpoints (create/update/delete). */
export const requireEdit = authorize(PermissionType.EDIT);
