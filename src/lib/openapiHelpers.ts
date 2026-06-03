/**
 * Helpers for assembling per-module OpenAPI fragments without hand-writing the
 * repetitive boilerplate for every CRUD endpoint. Each module exports an
 * `OpenapiFragment`; `src/lib/openapi.ts` merges them into the served document.
 */

export type OpenapiObject = Record<string, unknown>;
export type OpenapiPaths = Record<string, OpenapiObject>;
export type OpenapiSchemas = Record<string, OpenapiObject>;

export interface OpenapiTag {
  name: string;
  description: string;
}

export interface OpenapiFragment {
  paths: OpenapiPaths;
  schemas: OpenapiSchemas;
  tags: OpenapiTag[];
}

/** `$ref` to a component schema. */
export function ref(schemaName: string): OpenapiObject {
  return { $ref: `#/components/schemas/${schemaName}` };
}

/** JSON request/response body wrapper around a schema (ref or inline). */
export function jsonContent(schema: OpenapiObject): OpenapiObject {
  return { 'application/json': { schema } };
}

/** Standard error responses shared by every endpoint. */
export function errorResponses(...codes: Array<'400' | '401' | '403' | '404' | '409'>): OpenapiObject {
  const all: Record<string, OpenapiObject> = {
    '400': { description: 'Validation failed', content: jsonContent(ref('Error')) },
    '401': { description: 'Authentication required', content: jsonContent(ref('Error')) },
    '403': { description: 'Missing permission', content: jsonContent(ref('Error')) },
    '404': { description: 'Not found', content: jsonContent(ref('Error')) },
    '409': { description: 'Conflict', content: jsonContent(ref('Error')) },
  };
  const out: OpenapiObject = {};
  for (const code of codes) out[code] = all[code];
  return out;
}

/** A `{ data, meta }` list-envelope response schema wrapping an item ref. */
export function listResponseSchema(itemSchemaName: string): OpenapiObject {
  return {
    type: 'object',
    properties: {
      data: { type: 'array', items: ref(itemSchemaName) },
      meta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
        },
        required: ['page', 'limit', 'total'],
      },
    },
    required: ['data', 'meta'],
  };
}

/** Standard pagination/sort query parameters. */
export function listQueryParams(sortable: readonly string[]): OpenapiObject[] {
  return [
    { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
    { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
    { name: 'sort', in: 'query', schema: { type: 'string', enum: [...sortable] } },
    { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
    { name: 'include_deleted', in: 'query', schema: { type: 'boolean', default: false } },
  ];
}

export interface CrudPathOptions {
  /** Base path, e.g. `/users`. */
  base: string;
  /** OpenAPI tag name. */
  tag: string;
  /** Singular human label, e.g. `user`. */
  label: string;
  /** Component schema name for the full resource, e.g. `User`. */
  resource: string;
  /** Component schema name for the create body, e.g. `UserCreate`. */
  createSchema: string;
  /** Component schema name for the update body, e.g. `UserUpdate`. */
  updateSchema: string;
  /** Sortable fields advertised on the list endpoint. */
  sortable: readonly string[];
  /** Path param name (default `id`) and its schema. */
  idParam?: { name: string; schema: OpenapiObject };
  /** Extra query params on the list endpoint (filters). */
  listFilters?: OpenapiObject[];
  /** Whether a PATCH endpoint exists (default true). */
  patch?: boolean;
}

/** Builds the canonical 5 CRUD path items for a resource. */
export function crudPaths(opts: CrudPathOptions): OpenapiPaths {
  const idParam = opts.idParam ?? { name: 'id', schema: { type: 'string', format: 'uuid' } };
  const itemPath = `${opts.base}/{${idParam.name}}`;
  const idPathParam = {
    name: idParam.name,
    in: 'path',
    required: true,
    schema: idParam.schema,
  };

  const itemMethods: OpenapiObject = {
    get: {
      tags: [opts.tag],
      summary: `Get a ${opts.label} by id`,
      parameters: [idPathParam],
      responses: {
        '200': { description: opts.label, content: jsonContent(ref(opts.resource)) },
        ...errorResponses('401', '403', '404'),
      },
    },
    delete: {
      tags: [opts.tag],
      summary: `Delete a ${opts.label}`,
      parameters: [idPathParam],
      responses: {
        '204': { description: 'Deleted' },
        ...errorResponses('401', '403', '404', '409'),
      },
    },
  };

  if (opts.patch !== false) {
    itemMethods.patch = {
      tags: [opts.tag],
      summary: `Update a ${opts.label}`,
      parameters: [idPathParam],
      requestBody: { required: true, content: jsonContent(ref(opts.updateSchema)) },
      responses: {
        '200': { description: 'Updated', content: jsonContent(ref(opts.resource)) },
        ...errorResponses('400', '401', '403', '404', '409'),
      },
    };
  }

  return {
    [opts.base]: {
      get: {
        tags: [opts.tag],
        summary: `List ${opts.label}s`,
        parameters: [...listQueryParams(opts.sortable), ...(opts.listFilters ?? [])],
        responses: {
          '200': {
            description: `Page of ${opts.label}s`,
            content: jsonContent(listResponseSchema(opts.resource)),
          },
          ...errorResponses('400', '401', '403'),
        },
      },
      post: {
        tags: [opts.tag],
        summary: `Create a ${opts.label}`,
        requestBody: { required: true, content: jsonContent(ref(opts.createSchema)) },
        responses: {
          '201': { description: 'Created', content: jsonContent(ref(opts.resource)) },
          ...errorResponses('400', '401', '403', '404', '409'),
        },
      },
    },
    [itemPath]: itemMethods,
  };
}

/** The shared `Error` component schema. */
export const errorSchema: OpenapiObject = {
  type: 'object',
  properties: {
    error: { type: 'string', example: 'NotFound' },
    message: { type: 'string' },
    details: {},
  },
  required: ['error', 'message'],
};
