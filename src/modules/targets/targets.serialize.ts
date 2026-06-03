/**
 * Live-data contract serializers for targets. Renames `id`→`target_id`, converts
 * the stored GeoJSON Point to `{ lng, lat }`, and lowercases the status enum.
 */
import type { Target } from '@prisma/client';

import { pointToLngLat, type LngLat } from '../../geo/geo.js';
import { toContractEnum } from '../../lib/enumCase.js';

/** GET /api/targets/:target_id — full target. */
export function toContractTarget(t: Target): {
  target_id: string;
  location: LngLat;
  name: string;
  status: string;
} {
  return {
    target_id: t.id,
    location: pointToLngLat(t.location),
    name: t.name,
    status: toContractEnum(t.status),
  };
}

/** POST /api/targets — create result. */
export function toContractTargetCreated(t: Target): {
  target_id: string;
  status: string;
  create_date: Date;
} {
  return {
    target_id: t.id,
    status: toContractEnum(t.status),
    create_date: t.create_date,
  };
}
