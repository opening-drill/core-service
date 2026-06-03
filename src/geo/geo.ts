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
                .min(4, { message: 'A polygon ring must have at least 4 positions (closed ring)' }),
        )
        .min(1, { message: 'A polygon must have at least one ring' }),
});
export type GeoJsonPolygon = z.infer<typeof GeoJsonPolygonSchema>;

/** Validates an unknown value as a GeoJSON Point (throws ZodError → 400). */
export function validatePoint(value: unknown): GeoJsonPoint {
    return GeoJsonPointSchema.parse(value);
}

/** Validates an unknown value as a GeoJSON Polygon (throws ZodError → 400). */
export function validatePolygon(value: unknown): GeoJsonPolygon {
    return GeoJsonPolygonSchema.parse(value);
}

/** A validated GeoJSON object, ready for assignment to a Prisma `Json` column. */
export function toGeoJsonInput(value: GeoJsonPoint | GeoJsonPolygon): Prisma.InputJsonValue {
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
