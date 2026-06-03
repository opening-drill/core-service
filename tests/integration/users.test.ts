/**
 * DB-backed integration coverage for the Users module + RBAC. Auto-skips unless
 * DATABASE_URL points at a dedicated test database (see tests/helpers/db.ts).
 * Run with e.g. `DATABASE_URL=postgres://…/core_test NODE_ENV=test npm test`.
 */
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { basicHeader } from '../helpers/auth.js';
import { hasTestDb, resetDatabase, seedTestRbac, testPrisma, type SeededRbac } from '../helpers/db.js';

describe.skipIf(!hasTestDb)('Users API (DB)', () => {
  const app = createApp();
  let rbac: SeededRbac;
  let adminAuth: string;
  let viewerAuth: string;

  beforeEach(async () => {
    await resetDatabase();
    rbac = await seedTestRbac();
    adminAuth = basicHeader(rbac.adminUsername, rbac.adminPassword);
    viewerAuth = basicHeader(rbac.viewerUsername, rbac.viewerPassword);
  });

  afterAll(async () => {
    await testPrisma().$disconnect();
  });

  it('creates a user and never returns the password', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', adminAuth)
      .send({ full_name: 'Jane Pilot', username: 'jane', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ full_name: 'Jane Pilot', username: 'jane' });
    expect(res.body.password).toBeUndefined();
  });

  it('rejects a duplicate username with 409', async () => {
    const make = () =>
      request(app)
        .post('/api/users')
        .set('Authorization', adminAuth)
        .send({ full_name: 'Dup', username: 'dup', password: 'password123' });
    expect((await make()).status).toBe(201);
    expect((await make()).status).toBe(409);
  });

  it('403s when a VIEW-only user attempts to write', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', viewerAuth)
      .send({ full_name: 'No', username: 'no', password: 'password123' });
    expect(res.status).toBe(403);
  });

  it('soft-deletes: deleted users 404 on GET but reappear with include_deleted', async () => {
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', adminAuth)
      .send({ full_name: 'Temp', username: 'temp', password: 'password123' });
    const id = created.body.id as string;

    expect((await request(app).delete(`/api/users/${id}`).set('Authorization', adminAuth)).status).toBe(204);
    expect((await request(app).get(`/api/users/${id}`).set('Authorization', adminAuth)).status).toBe(404);

    const list = await request(app).get('/api/users?include_deleted=true').set('Authorization', adminAuth);
    expect(list.status).toBe(200);
    expect(list.body.data.some((u: { id: string }) => u.id === id)).toBe(true);
    expect(list.body.meta).toMatchObject({ page: 1, limit: 20 });
  });

  it('reactivates a soft-deleted role assignment instead of duplicating', async () => {
    const username = 'assignee';
    await request(app)
      .post('/api/users')
      .set('Authorization', adminAuth)
      .send({ full_name: 'Assignee', username, password: 'password123' });

    // :user_id is the username per the live-data contract.
    const assign = () =>
      request(app).post(`/api/users/${username}/roles`).set('Authorization', adminAuth).send({ role_id: rbac.viewerRoleId });

    const first = await assign();
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ user_id: username, role_id: rbac.viewerRoleId });
    expect((await assign()).status).toBe(409); // duplicate active assignment
    expect(
      (await request(app).delete(`/api/users/${username}/roles/${rbac.viewerRoleId}`).set('Authorization', adminAuth)).status,
    ).toBe(204);
    expect((await assign()).status).toBe(201); // reactivated, not duplicated

    const roles = await request(app).get(`/api/users/${username}/roles`).set('Authorization', adminAuth);
    expect(roles.body.filter((r: { role_id: string }) => r.role_id === rbac.viewerRoleId)).toHaveLength(1);
  });

  it('assigns a role by role_name', async () => {
    const username = 'byname';
    await request(app)
      .post('/api/users')
      .set('Authorization', adminAuth)
      .send({ full_name: 'By Name', username, password: 'password123' });

    const res = await request(app)
      .post(`/api/users/${username}/roles`)
      .set('Authorization', adminAuth)
      .send({ role_name: 'viewer' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ user_id: username, role_id: rbac.viewerRoleId });
    expect(typeof res.body.created_at).toBe('string');
  });

  it('GET /users/:user_id/permissions returns roles & lowercased permissions', async () => {
    const res = await request(app)
      .get(`/api/users/${rbac.viewerUsername}/permissions`)
      .set('Authorization', viewerAuth);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ user_id: rbac.viewerUsername });
    expect(res.body.roles).toContain('viewer');
    expect(res.body.permissions).toEqual(['view']);
  });

  it('POST /users/auth authenticates and returns the user with roles (no auth header)', async () => {
    const ok = await request(app)
      .post('/api/users/auth')
      .send({ username: rbac.adminUsername, password: rbac.adminPassword });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ user_id: rbac.adminUsername, full_name: 'Admin' });
    expect(ok.body.roles).toContain('admin');
    expect(ok.body.permissions).toEqual(expect.arrayContaining(['view', 'edit']));

    const bad = await request(app)
      .post('/api/users/auth')
      .send({ username: rbac.adminUsername, password: 'wrong-password' });
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe('UNAUTHORIZED');
  });

  it('/auth/me reports the caller’s roles and permissions', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', viewerAuth);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(rbac.viewerUsername);
    expect(res.body.roles).toContain('viewer');
    expect(res.body.permissions).toEqual(['VIEW']);
  });
});
