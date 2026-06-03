import z from "zod";

/**
 * GeoJSON helpers — zod schemas for `Point` / `Polygon` (WGS84 / EPSG:4326)
 * plus (de)serialization helpers for Prisma `Json` geography columns.
 * */
export const GeoJsonPointSchema = z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
});

export type GeoJsonPoint = z.infer<typeof GeoJsonPointSchema>;

export const GeoJsonPathSchema = z.array(// TODO: Use for history
    z.tuple([z.number(), z.number()]),
);

export type GeoJsonPath = z.infer<typeof GeoJsonPathSchema>;

export const GeoJsonPolygonSchema = z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(
        z.array(z.tuple([z.number(), z.number()]))
            .min(3, { message: 'A polygon must have at least 3 coordinates' })
    ),
});

export type GeoJsonPolygon = z.infer<typeof GeoJsonPolygonSchema>;
