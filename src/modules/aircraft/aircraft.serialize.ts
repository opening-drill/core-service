/**
 * Live-data contract serializers + Prisma include for aircraft. Renames
 * `id`→`aircraft_id`, exposes the type name as `aircraft_type`, lowercases the
 * status, and folds the latest telemetry row into the `/live` shape.
 */
import { Prisma } from '@prisma/client';

import { pointToLngLat, type LngLat } from '../../geo/geo.js';
import { toContractEnum } from '../../lib/enumCase.js';

/** Include needed to expose `aircraft_type` (the type's name). */
export const aircraftTypeInclude = { type: { select: { name: true } } } satisfies Prisma.AircraftInclude;
export type AircraftWithType = Prisma.AircraftGetPayload<{ include: typeof aircraftTypeInclude }>;

/** Latest telemetry row for an aircraft (from a DISTINCT ON query). */
export interface LatestPosition {
  location: Prisma.JsonValue;
  altitude: number | null;
  heading_degrees: number | null;
  update_date: Date;
}

/** GET /api/aircraft (?status=) list item. */
export function toContractAircraftListItem(a: AircraftWithType): {
  aircraft_id: string;
  aircraft_type: string;
  status: string;
} {
  return { aircraft_id: a.id, aircraft_type: a.type.name, status: toContractEnum(a.status) };
}

/** Wraps aircraft items in the contract's named envelope. */
export function aircraftEnvelope<T>(aircraft: T[]): { aircraft: T[] } {
  return { aircraft };
}

/** GET /api/aircraft/live — aircraft with its latest position (nulls if none). */
export function toContractAircraftLive(a: AircraftWithType, latest: LatestPosition | null): {
  aircraft_id: string;
  aircraft_type: string;
  status: string;
  location: LngLat | null;
  altitude: number | null;
  heading_degrees: number | null;
  update_date: Date | null;
} {
  return {
    aircraft_id: a.id,
    aircraft_type: a.type.name,
    status: toContractEnum(a.status),
    location: latest ? pointToLngLat(latest.location) : null,
    altitude: latest?.altitude ?? null,
    heading_degrees: latest?.heading_degrees ?? null,
    update_date: latest?.update_date ?? null,
  };
}
