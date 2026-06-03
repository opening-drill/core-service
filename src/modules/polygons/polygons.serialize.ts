/**
 * Live-data contract serializer for polygons (danger zones). Lowercases `zone`,
 * exposes the stored `geojson` as `area` (kept as raw GeoJSON per the contract),
 * and emits `state_duartion` — the contract's (misspelled) key.
 *
 * NOTE: the DB has no duration column; it stores `expiry_date`. We derive
 * `state_duartion` as the minutes between `create_date` and `expiry_date`.
 * (Flagged for the live-data team — confirm the intended unit/semantics.)
 */
import type { Polygon } from '@prisma/client';

import { toContractEnum } from '../../lib/enumCase.js';

const MS_PER_MINUTE = 60_000;

/** GET /api/polygons item. */
export function toContractPolygon(p: Polygon): {
  id: string;
  name: string;
  zone: string;
  state_duartion: number;
  area: unknown;
} {
  const durationMinutes = Math.max(
    0,
    Math.round((p.expiry_date.getTime() - p.create_date.getTime()) / MS_PER_MINUTE),
  );
  return {
    id: p.id,
    name: p.name,
    zone: toContractEnum(p.zone),
    // Intentional: matches the contract's `state_duartion` spelling; derived.
    state_duartion: durationMinutes,
    area: p.geojson,
  };
}

/** Wraps polygon items in the contract's named envelope. */
export function polygonsEnvelope<T>(polygons: T[]): { polygons: T[] } {
  return { polygons };
}
