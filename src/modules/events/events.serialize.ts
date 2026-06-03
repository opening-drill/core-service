/**
 * Live-data contract serializers + Prisma include shapes for events.
 *
 * Keeps the includes colocated with the serializers that consume them so the
 * row types stay in lock-step with the output shapes. `user_id` is serialized
 * from the related `User.username` (the contract's user identifier); ids are
 * renamed to their entity-prefixed form; coordinates become `{ lng, lat }`.
 */
import { Prisma } from '@prisma/client';

import { pathToLngLatArray, pointToLngLat, type LngLat } from '../../geo/geo.js';
import { toContractEnum } from '../../lib/enumCase.js';

/** Detail (GET /api/events/:event_id). */
export const eventDetailInclude = {
  user: { select: { username: true } },
  target: true,
  picture: { select: { id: true, file_name: true } },
} satisfies Prisma.EventInclude;
type EventDetail = Prisma.EventGetPayload<{ include: typeof eventDetailInclude }>;

/** List item (GET /api/events). */
export const eventListInclude = {
  user: { select: { username: true } },
} satisfies Prisma.EventInclude;
type EventListRow = Prisma.EventGetPayload<{ include: typeof eventListInclude }>;

/** Event slice for ai-context. */
export const aiContextEventInclude = {
  target: { select: { location: true } },
  picture: { select: { s3_bucket_id: true, s3_object_id: true } },
} satisfies Prisma.EventInclude;
type AiContextEvent = Prisma.EventGetPayload<{ include: typeof aiContextEventInclude }>;

/** Aircraft slice for ai-context (path history ascending). */
export const aiContextAircraftInclude = {
  type: { select: { name: true } },
  path_history: {
    orderBy: { update_date: 'asc' },
    select: { location: true, update_date: true },
  },
} satisfies Prisma.AircraftInclude;
type AiContextAircraft = Prisma.AircraftGetPayload<{ include: typeof aiContextAircraftInclude }>;

/** POST /api/events — create result. */
export function toContractEventCreated(e: { id: string; create_date: Date }): {
  event_id: string;
  create_date: Date;
} {
  return { event_id: e.id, create_date: e.create_date };
}

/** GET /api/events/:event_id — full event with nested target & picture. */
export function toContractEventDetail(e: EventDetail) {
  return {
    event_id: e.id,
    user_id: e.user.username,
    target_id: e.target_id,
    picture_id: e.picture_id,
    aircraft_id: e.aircraft_id,
    ai_recommendation_id: e.ai_recommendation_id,
    create_date: e.create_date,
    update_date: e.update_date,
    target: {
      target_id: e.target.id,
      location: pointToLngLat(e.target.location),
      name: e.target.name,
      status: toContractEnum(e.target.status),
    },
    picture: {
      picture_id: e.picture.id,
      file_name: e.picture.file_name,
    },
  };
}

/** GET /api/events — list item. */
export function toContractEventListItem(e: EventListRow): {
  event_id: string;
  user_id: string;
  target_id: string;
  create_date: Date;
} {
  return {
    event_id: e.id,
    user_id: e.user.username,
    target_id: e.target_id,
    create_date: e.create_date,
  };
}

/** Wraps list items in the contract's named envelope. */
export function eventsEnvelope<T>(events: T[]): { events: T[] } {
  return { events };
}

/** GET /api/events/:event_id/ai-context — bundled context for AI. */
export function toAiContext(event: AiContextEvent, aircrafts: AiContextAircraft[]): {
  event_context: { event_id: string; picture_id: string; target_location: LngLat; image_path: string };
  aircraft_context: {
    aircrafts: Array<{
      aircraft_id: string;
      aircraft_type: string;
      path_history: Array<{ timestamp: Date; location: LngLat[] }>;
    }>;
  };
} {
  return {
    event_context: {
      event_id: event.id,
      picture_id: event.picture_id,
      target_location: pointToLngLat(event.target.location),
      image_path: `s3://${event.picture.s3_bucket_id}/${event.picture.s3_object_id}`,
    },
    aircraft_context: {
      aircrafts: aircrafts.map((a) => ({
        aircraft_id: a.id,
        aircraft_type: a.type.name,
        path_history: a.path_history.map((p) => ({
          timestamp: p.update_date,
          location: pathToLngLatArray(p.location),
        })),
      })),
    },
  };
}
