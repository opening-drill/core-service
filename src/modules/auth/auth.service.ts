import { PermissionType } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { API_KEY_PRINCIPAL } from '../../middleware/apiKeyAuth.js';
import { loadUserPermissions } from '../../middleware/authorize.js';
import type { AuthUser } from '../../types/auth.js';

export interface MeResponse extends AuthUser {
  roles: string[];
  permissions: PermissionType[];
}

export const authService = {
  /** Returns the authenticated principal with effective roles & permissions. */
  async me(user: AuthUser): Promise<MeResponse> {
    if (user.id === API_KEY_PRINCIPAL.id) {
      return {
        ...user,
        roles: ['api-key'],
        permissions: [PermissionType.VIEW, PermissionType.EDIT],
      };
    }

    const roleRows = await prisma.userRole.findMany({
      where: { user_id: user.id, delete_date: null, role: { delete_date: null } },
      select: { role: { select: { name: true } } },
    });
    const permissions = await loadUserPermissions(user.id);
    return {
      ...user,
      roles: roleRows.map((r) => r.role.name),
      permissions: [...permissions],
    };
  },
};
