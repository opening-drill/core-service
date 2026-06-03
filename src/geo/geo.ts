import z from "zod";
import type { Prisma } from '@prisma/client';

/**
 * GeoJSON helpers — zod schemas for `Point` / `Polygon` (WGS84 / EPSG:4326)
 * plus (de)serialization helpers for Prisma `Json` geography columns.
 *
 * Geography is stored as GeoJSON inside JSONB columns (no PostGIS). Shapes are
 * validated on the way in and trusted (cast) on the way out.
 */

const longitude = z.number().min(-180).max(180);
const latitude = z.number().min(-90).max(90);

/** A `[longitude, latitude]` coordinate pair within valid WGS84 bounds. */
const coordinate = z.tuple([longitude, latitude]);

export const GeoJsonPointSchema = z.object({
    type: z.literal('Point'),
    coordinates: coordinate,
});
export type GeoJsonPoint = z.infer<typeof GeoJsonPointSchema>;

export const GeoJsonPolygonSchema = z.object({
    type: z.literal('Polygon'),
    coordinates: z
        .array(
            z
                .array(coordinate)
                .min(3, { message: 'A polygon must have at least 3 positions' }),
        )
});

export type GeoJsonPolygon = z.infer<typeof GeoJsonPolygonSchema>;

/**
 * A Path — an ordered array of `[longitude, latitude]` coordinate pairs
 * representing a trajectory or track. Stored as a raw JSON array in JSONB.
 */
export const PathSchema = z
    .array(coordinate)
    .min(1, { message: 'A path must have at least 1 coordinate' });
export type Path = z.infer<typeof PathSchema>;

/** Validates an unknown value as a GeoJSON Point (throws ZodError → 400). */
export function validatePoint(value: unknown): GeoJsonPoint {
    return GeoJsonPointSchema.parse(value);
}

/** Validates an unknown value as a GeoJSON Polygon (throws ZodError → 400). */
export function validatePolygon(value: unknown): GeoJsonPolygon {
    return GeoJsonPolygonSchema.parse(value);
}

/** Validates an unknown value as a Path (throws ZodError → 400). */
export function validatePath(value: unknown): Path {
    return PathSchema.parse(value);
}

/** A validated GeoJSON object, ready for assignment to a Prisma `Json` column. */
export function toGeoJsonInput(value: GeoJsonPoint | GeoJsonPolygon): Prisma.InputJsonValue {
    return value;
}

/** A validated Path array, ready for assignment to a Prisma `Json` column. */
export function toPathInput(value: Path): Prisma.InputJsonValue {
    return value;
}

/** Reads a Prisma `Json` Point column back as a typed GeoJSON Point. */
export function parseGeoJsonPoint(value: Prisma.JsonValue): GeoJsonPoint {
    return value as unknown as GeoJsonPoint;
}

/** Reads a Prisma `Json` Polygon column back as a typed GeoJSON Polygon. */
export function parseGeoJsonPolygon(value: Prisma.JsonValue): GeoJsonPolygon {
    return value as unknown as GeoJsonPolygon;
}

/** Reads a Prisma `Json` Path column back as a typed Path. */
export function parsePath(value: Prisma.JsonValue): Path {
    return value as unknown as Path;
}

/**
 * The live-data contract exchanges coordinates as `{ lng, lat }` objects, while
 * the database stores them as GeoJSON `Point` (`coordinates: [lng, lat]`). These
 * helpers convert at the API boundary in both directions.
 */
export const LngLatSchema = z.object({ lng: longitude, lat: latitude }).strict();
export type LngLat = z.infer<typeof LngLatSchema>;

/** `{ lng, lat }` (inbound body) → GeoJSON Point ready for a Prisma `Json` column. */
export function lngLatToPoint(coordinates: LngLat): GeoJsonPoint {
    return { type: 'Point', coordinates: [coordinates.lng, coordinates.lat] };
}

/** Prisma `Json` Point column → `{ lng, lat }` for outbound serialization. */
export function pointToLngLat(value: Prisma.JsonValue): LngLat {
    const point = parseGeoJsonPoint(value);
    return { lng: point.coordinates[0], lat: point.coordinates[1] };
}

/** `{ lng, lat }[]` (inbound body) → Path array ready for a Prisma `Json` column. */
export function lngLatArrayToPath(locations: LngLat[]): Path {
    return locations.map((loc) => [loc.lng, loc.lat] as [number, number]);
}

/** Prisma `Json` Path column → `{ lng, lat }[]` for outbound serialization. */
export function pathToLngLatArray(value: Prisma.JsonValue): LngLat[] {
    const path = parsePath(value);
    return path.map(([lng, lat]) => ({ lng, lat }));
}
