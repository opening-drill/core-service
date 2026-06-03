/**
 * Live-data contract serializers for path-history points (`/path`, `/track`).
 * Converts the stored GeoJSON Point to `{ lng, lat }`.
 */
import type { AircraftPathHistory } from '@prisma/client';

import { pointToLngLat, type LngLat } from '../../geo/geo.js';

/** GET /api/aircraft/:aircraft_id/path point. */
export function toContractPathPoint(p: AircraftPathHistory): {
  location: LngLat;
  altitude: number | null;
  heading_degrees: number | null;
  update_date: Date;
} {
  return {
    location: pointToLngLat(p.location),
    altitude: p.altitude,
    heading_degrees: p.heading_degrees,
    update_date: p.update_date,
  };
}

/** GET /api/aircraft/:aircraft_id/track point (debrief). */
export function toContractTrackPoint(p: AircraftPathHistory): {
  location: LngLat;
  altitude: number | null;
  update_date: Date;
} {
  return {
    location: pointToLngLat(p.location),
    altitude: p.altitude,
    update_date: p.update_date,
  };
}
