import { z } from 'zod';

/**
 * Shared list-query infrastructure: pagination, sorting, soft-delete filtering,
 * and the standard list-response envelope. Every list endpoint extends
 * `buildListQuerySchema()` with its own filters and feeds the parsed result
 * through `toPrismaList()`.
 */

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Base pagination/sort/soft-delete query schema. Pass the fields a module
 * allows sorting on; the first is used as the default sort unless overridden.
 */
export function buildListQuerySchema<const F extends readonly [string, ...string[]]>(
  sortableFields: F,
) {
  return z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
    sort: z.enum(sortableFields).optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
    include_deleted: z.coerce.boolean().default(false),
  });
}

export interface ListQueryBase {
  page: number;
  limit: number;
  sort?: string | undefined;
  order: 'asc' | 'desc';
  include_deleted: boolean;
}

export interface PrismaListArgs {
  skip: number;
  take: number;
  orderBy: Record<string, 'asc' | 'desc'>;
}

/** Translates a parsed list query into Prisma `skip` / `take` / `orderBy`. */
export function toPrismaList(query: ListQueryBase, defaultSort: string): PrismaListArgs {
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    orderBy: { [query.sort ?? defaultSort]: query.order },
  };
}

/**
 * Soft-delete `where` fragment. Returns `{ delete_date: null }` to hide deleted
 * rows, or `{}` when `include_deleted` is true. Only for models with a
 * `delete_date` column.
 */
export function softDeleteWhere(includeDeleted: boolean): { delete_date?: null } {
  return includeDeleted ? {} : { delete_date: null };
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ListResult<T> {
  data: T[];
  meta: ListMeta;
}

/** Wraps a page of rows in the standard `{ data, meta }` list envelope. */
export function buildListResult<T>(
  data: T[],
  meta: { page: number; limit: number; total: number },
): ListResult<T> {
  return { data, meta };
}
