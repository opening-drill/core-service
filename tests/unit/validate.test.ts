import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { errorHandler } from '../../src/middleware/errorHandler.js';
import { getQuery, validate } from '../../src/middleware/validate.js';

const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1) });

function makeApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.post(
    '/echo',
    validate({
      body: z.object({ name: z.string().min(1) }),
      query: querySchema,
    }),
    (req, res) => {
      res.json({ body: req.body, query: getQuery(req, querySchema) });
    },
  );
  app.use(errorHandler);
  return app;
}

describe('validate middleware', () => {
  it('passes valid input and coerces query', async () => {
    const res = await request(makeApp()).post('/echo?page=4').send({ name: 'jet' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ body: { name: 'jet' }, query: { page: 4 } });
  });

  it('returns 400 ValidationError on bad body', async () => {
    const res = await request(makeApp()).post('/echo').send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
    expect(Array.isArray(res.body.details)).toBe(true);
  });
});
