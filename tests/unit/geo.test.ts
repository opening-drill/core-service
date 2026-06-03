import { describe, expect, it } from 'vitest';

import { validatePoint, validatePolygon } from '../../src/geo/geo.js';

describe('geo validation', () => {
  it('accepts a valid Point', () => {
    const p = validatePoint({ type: 'Point', coordinates: [34.4, 31.5] });
    expect(p.coordinates).toEqual([34.4, 31.5]);
  });

  it('rejects out-of-range coordinates', () => {
    expect(() => validatePoint({ type: 'Point', coordinates: [200, 0] })).toThrow();
    expect(() => validatePoint({ type: 'Point', coordinates: [0, 100] })).toThrow();
  });

  it('rejects a non-Point shape', () => {
    expect(() => validatePoint({ type: 'Polygon', coordinates: [] })).toThrow();
  });

  it('accepts a closed Polygon ring (>=4 positions)', () => {
    const poly = validatePolygon({
      type: 'Polygon',
      coordinates: [
        [
          [34.4, 31.5],
          [34.5, 31.5],
          [34.5, 31.6],
          [34.4, 31.5],
        ],
      ],
    });
    expect(poly.coordinates[0]).toHaveLength(4);
  });

  it('rejects a ring with too few positions', () => {
    expect(() =>
      validatePolygon({
        type: 'Polygon',
        coordinates: [
          [
            [34.4, 31.5],
            [34.5, 31.5],
          ],
        ],
      }),
    ).toThrow();
  });
});
