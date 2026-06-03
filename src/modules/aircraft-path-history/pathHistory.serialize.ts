/**
 * Live-data contract serializers for path-history points (`/path`, `/track`).
 * Converts the stored Path (array of [lng, lat]) to `{ lng, lat }[]`.
 */
import type { AircraftPathHistory } from '@prisma/client';

import { pathToLngLatArray, type LngLat } from '../../geo/geo.js';

/** GET /api/aircraft/:aircraft_id/path point. */
export function toContractPathPoint(p: AircraftPathHistory): {
  location: LngLat[];
  update_date: Date;
} {
  return {
    location: pathToLngLatArray(p.location),
    update_date: p.update_date,
  };
}

/** GET /api/aircraft/:aircraft_id/track point (debrief). */
export function toContractTrackPoint(p: AircraftPathHistory): {
  location: LngLat[];
  update_date: Date;
} {
  return {
    location: pathToLngLatArray(p.location),
    update_date: p.update_date,
  };
}
