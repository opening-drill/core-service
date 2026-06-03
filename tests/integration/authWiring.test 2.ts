/**
 * Auth-wiring checks that need no database: unauthenticated requests to
 * protected routes are rejected by basicAuth *before* any DB lookup, and the
 * public routes stay open. (A well-formed Basic header would trigger a DB
 * query, so these tests deliberately send none / a malformed one.)
 */
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';

const PROTECTED = ['/users', '/roles', '/permissions', '/polygons', '/targets', '/aircraft', '/events'];

describe('auth wiring (no DB)', () => {
  it('rejects unauthenticated access to protected routes with 401', async () => {
    const app = createApp();
    for (const path of PROTECTED) {
      const res = await request(app).get(path);
      expect(res.status, `${path} should require auth`).toBe(401);
      expect(res.headers['www-authenticate']).toMatch(/Basic/);
      expect(res.body.error).toBe('Unauthorized');
    }
  });

  it('rejects a malformed Authorization header with 401', async () => {
    const res = await request(createApp()).get('/users').set('Authorization', 'Bearer xyz');
    expect(res.status).toBe(401);
  });

  it('keeps health and openapi public', async () => {
    const app = createApp();
    expect((await request(app).get('/health')).status).toBe(200);
    expect((await request(app).get('/openapi.json')).status).toBe(200);
  });

  it('returns 400 for an unparyable Basic token without crashing', async () => {
    // "Basic <base64 without colon>" → malformed credentials → 401.
    const token = Buffer.from('nocolon').toString('base64');
    const res = await request(createApp()).get('/users').set('Authorization', `Basic ${token}`);
    expect(res.status).toBe(401);
  });
});
