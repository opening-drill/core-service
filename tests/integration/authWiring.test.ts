/**
 * Auth-wiring checks that need no database: protected routes require `X-Api-Key`.
 */
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { apiKeyHeader, TEST_API_KEY } from '../helpers/auth.js';

const PROTECTED = [
  '/api/users',
  '/api/roles',
  '/api/permissions',
  '/api/polygons',
  '/api/targets',
  '/api/aircraft',
  '/api/events',
];

describe('auth wiring (no DB)', () => {
  it('rejects unauthenticated access to protected routes with 401', async () => {
    const app = createApp();
    for (const path of PROTECTED) {
      const res = await request(app).get(path);
      expect(res.status, `${path} should require X-Api-Key`).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    }
  });

  it('rejects an invalid X-Api-Key with 401', async () => {
    const res = await request(createApp())
      .get('/api/users')
      .set(apiKeyHeader('wrong-key'));
    expect(res.status).toBe(401);
  });

  it('accepts a valid X-Api-Key on protected routes', async () => {
    const res = await request(createApp())
      .get('/api/users')
      .set(apiKeyHeader(TEST_API_KEY));
    expect(res.status).not.toBe(401);
  });

  it('keeps health and openapi public', async () => {
    const app = createApp();
    expect((await request(app).get('/health')).status).toBe(200);
    expect((await request(app).get('/openapi.json')).status).toBe(200);
  });

  it('returns 400 for malformed JSON bodies', async () => {
    const res = await request(createApp())
      .post('/api/users/signup')
      .set(apiKeyHeader(TEST_API_KEY))
      .set('Content-Type', 'application/json')
      .send('{"username":"x",}');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('POST /api/users/auth requires X-Api-Key and a JSON body', async () => {
    const app = createApp();
    expect((await request(app).post('/api/users/auth')).status).toBe(401);
    expect(
      (
        await request(app)
          .post('/api/users/auth')
          .set(apiKeyHeader(TEST_API_KEY))
      ).status,
    ).toBe(400);
  });
});
