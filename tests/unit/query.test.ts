import { describe, expect, it } from 'vitest';

import {
  buildListQuerySchema,
  softDeleteWhere,
  toPrismaList,
} from '../../src/lib/query.js';

describe('list query helpers', () => {
  const schema = buildListQuerySchema(['create_date', 'name']);

  it('applies defaults and coerces strings', () => {
    const parsed = schema.parse({});
    expect(parsed).toMatchObject({ page: 1, limit: 20, order: 'desc', include_deleted: false });

    const coerced = schema.parse({ page: '2', limit: '5', sort: 'name', order: 'asc' });
    expect(coerced).toMatchObject({ page: 2, limit: 5, sort: 'name', order: 'asc' });
  });

  it('rejects an unknown sort field and oversized limit', () => {
    expect(() => schema.parse({ sort: 'bogus' })).toThrow();
    expect(() => schema.parse({ limit: '1000' })).toThrow();
  });

  it('computes skip/take/orderBy', () => {
    const args = toPrismaList(schema.parse({ page: '3', limit: '10' }), 'create_date');
    expect(args).toEqual({ skip: 20, take: 10, orderBy: { create_date: 'desc' } });
  });

  it('builds the soft-delete where fragment', () => {
    expect(softDeleteWhere(false)).toEqual({ delete_date: null });
    expect(softDeleteWhere(true)).toEqual({});
  });
});
