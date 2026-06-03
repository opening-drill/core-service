/**
 * DB-backed integration coverage for the Users module + RBAC. Auto-skips unless
 * DATABASE_URL points at a dedicated test database (see tests/helpers/db.ts).
 */
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { apiKeyHeader, TEST_API_KEY } from '../helpers/auth.js';
import { hasTestDb, resetDatabase, seedTestRbac, testPrisma, type SeededRbac } from '../helpers/db.js';

describe.skipIf(!hasTestDb)('Users API (DB)', () => {
  const app = createApp();
  let rbac: SeededRbac;
  const auth = apiKeyHeader(TEST_API_KEY);

  beforeEach(async () => {
    await resetDatabase();
    rbac = await seedTestRbac();
  });

  afterAll(async () => {
    await testPrisma().$disconnect();
  });

  it('creates a user and never returns the password', async () => {
    const res = await request(app)
      .post('/api/users')
      .set(auth)
      .send({ full_name: 'Jane Pilot', username: 'jane', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ full_name: 'Jane Pilot', username: 'jane' });
    expect(res.body.password).toBeUndefined();
  });

  it('rejects a duplicate username with 409', async () => {
    const make = () =>
      request(app)
        .post('/api/users')
        .set(auth)
        .send({ full_name: 'Dup', username: 'dup', password: 'password123' });
    expect((await make()).status).toBe(201);
    expect((await make()).status).toBe(409);
  });

  it('soft-deletes: deleted users 404 on GET but reappear with include_deleted', async () => {
    const created = await request(app)
      .post('/api/users')
      .set(auth)
      .send({ full_name: 'Temp', username: 'temp', password: 'password123' });
    const id = created.body.id as string;

    expect((await request(app).delete(`/api/users/${id}`).set(auth)).status).toBe(204);
    expect((await request(app).get(`/api/users/${id}`).set(auth)).status).toBe(404);

    const list = await request(app).get('/api/users?include_deleted=true').set(auth);
    expect(list.status).toBe(200);
    expect(list.body.data.some((u: { id: string }) => u.id === id)).toBe(true);
    expect(list.body.meta).toMatchObject({ page: 1, limit: 20 });
  });

  it('reactivates a soft-deleted role assignment instead of duplicating', async () => {
    const username = 'assignee';
    await request(app)
      .post('/api/users')
      .set(auth)
      .send({ full_name: 'Assignee', username, password: 'password123' });

    const assign = () =>
      request(app).post(`/api/users/${username}/roles`).set(auth).send({ role_id: rbac.viewerRoleId });

    const first = await assign();
    expect(first.status).toBe(201);
    expect((await assign()).status).toBe(409);
    expect((await request(app).delete(`/api/users/${username}/roles/${rbac.viewerRoleId}`).set(auth)).status).toBe(204);
    expect((await assign()).status).toBe(201);

    const roles = await request(app).get(`/api/users/${username}/roles`).set(auth);
    expect(roles.body.filter((r: { role_id: string }) => r.role_id === rbac.viewerRoleId)).toHaveLength(1);
  });

  it('assigns a role by role_name', async () => {
    const username = 'byname';
    await request(app)
      .post('/api/users')
      .set(auth)
      .send({ full_name: 'By Name', username, password: 'password123' });

    const res = await request(app)
      .post(`/api/users/${username}/roles`)
      .set(auth)
      .send({ role_name: 'viewer' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ user_id: username, role_id: rbac.viewerRoleId });
  });

  it('GET /users/:user_id/permissions returns roles & lowercased permissions', async () => {
    const res = await request(app).get(`/api/users/${rbac.viewerUsername}/permissions`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.roles).toContain('viewer');
    expect(res.body.permissions).toEqual(['view']);
  });

  it('POST /api/users/signup provisions a user with the API key', async () => {
    const res = await request(app)
      .post('/api/users/signup')
      .set(auth)
      .send({ full_name: 'API User', username: 'apiuser', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      full_name: 'API User',
      username: 'apiuser',
      roles: ['viewer'],
      permissions: ['view'],
    });
  });

  it('rejects signup without a valid API key', async () => {
    const res = await request(app)
      .post('/api/users/signup')
      .send({ full_name: 'Bad', username: 'bad', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('POST /api/users/auth returns valid when X-Api-Key is correct', async () => {
    const res = await request(app).post('/api/users/auth').set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ valid: true });
  });

  it('/auth/me reports API key principal', async () => {
    const res = await request(app).get('/api/auth/me').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('api-key');
    expect(res.body.permissions).toEqual(expect.arrayContaining(['VIEW', 'EDIT']));
  });
});
