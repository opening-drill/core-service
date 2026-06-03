/**
 * DB-backed coverage for the live-data contract shapes (/api/*). Auto-skips
 * unless DATABASE_URL points at a dedicated test database (see helpers/db.ts).
 *
 * Exercises the "report target" flow plus aircraft telemetry, polygons, and the
 * nested error envelope. Fixtures that have no contract create route (aircraft,
 * path history, polygons) are inserted directly via testPrisma.
 */
import { AircraftStatus, Zone } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { apiKeyHeader, TEST_API_KEY } from '../helpers/auth.js';
import { hasTestDb, resetDatabase, seedTestRbac, testPrisma, type SeededRbac } from '../helpers/db.js';

const point = (lng: number, lat: number) => ({ type: 'Point' as const, coordinates: [lng, lat] });

/** The multipart upload needs real object storage; gate that one test on it. */
const hasObjectStorage = Boolean(
  process.env.GCS_BUCKET ||
    (process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY),
);

describe.skipIf(!hasTestDb)('Live-data contract (DB)', () => {
  const app = createApp();
  let rbac: SeededRbac;
  let auth: ReturnType<typeof apiKeyHeader>;

  beforeEach(async () => {
    await resetDatabase();
    rbac = await seedTestRbac();
    auth = apiKeyHeader(TEST_API_KEY);
  });

  afterAll(async () => {
    await testPrisma().$disconnect();
  });

  /** Inserts an aircraft of the given status with one path-history point. */
  async function seedAircraft(status: AircraftStatus, lng = 34.8, lat = 32.1) {
    const prisma = testPrisma();
    const type = await prisma.aircraftType.create({
      data: { name: 'F-15', price: 1, velocity_kmh: 900, payload_kg: 100 },
    });
    const aircraft = await prisma.aircraft.create({ data: { type_id: type.id, status } });
    await prisma.aircraftPathHistory.create({
      data: { aircraft_id: aircraft.id, location: point(lng, lat), altitude: 1200, heading_degrees: 270 },
    });
    return { aircraftId: aircraft.id, typeId: type.id };
  }

  it('runs the report-target flow with contract shapes', async () => {
    // 1. Picture — inserted directly (the single-request multipart upload path
    // exercises live S3; the flow only needs a picture_id here).
    const picture = await testPrisma().picture.create({
      data: { file_name: 'target-123.png', s3_object_id: 'evt/abc.png', s3_bucket_id: 'field-images' },
    });
    const pictureId = picture.id;

    // image ref for AI
    const ref = await request(app).get(`/api/storage/pictures/${pictureId}`).set(auth);
    expect(ref.body).toMatchObject({
      picture_id: pictureId,
      image_path: 's3://field-images/evt/abc.png',
      object_key: 'evt/abc.png',
      bucket: 'field-images',
    });

    // 2. Target.
    const target = await request(app)
      .post('/api/targets')
      .set(auth)
      .send({ location: { lng: 34.79, lat: 32.07 }, name: 'North bunker', status: 'standing' });
    expect(target.status).toBe(201);
    expect(target.body).toMatchObject({ status: 'standing' });
    const targetId = target.body.target_id as string;

    const gotTarget = await request(app).get(`/api/targets/${targetId}`).set(auth);
    expect(gotTarget.body).toMatchObject({
      target_id: targetId,
      location: { lng: 34.79, lat: 32.07 },
      name: 'North bunker',
      status: 'standing',
    });

    // 3. Event (user_id = username).
    const event = await request(app)
      .post('/api/events')
      .set(auth)
      .send({ user_id: rbac.adminUsername, target_id: targetId, picture_id: pictureId });
    expect(event.status).toBe(201);
    const eventId = event.body.event_id as string;

    const detail = await request(app).get(`/api/events/${eventId}`).set(auth);
    expect(detail.body).toMatchObject({
      event_id: eventId,
      user_id: rbac.adminUsername,
      target: { target_id: targetId, location: { lng: 34.79, lat: 32.07 }, status: 'standing' },
      picture: { picture_id: pictureId, file_name: 'target-123.png' },
    });

    const list = await request(app).get('/api/events').set(auth);
    expect(Array.isArray(list.body.events)).toBe(true);
    expect(list.body.events[0]).toMatchObject({ event_id: eventId, user_id: rbac.adminUsername });

    // 4. ai-context (free aircraft).
    const { aircraftId: freeId } = await seedAircraft(AircraftStatus.FREE);
    const ctx = await request(app).get(`/api/events/${eventId}/ai-context`).set(auth);
    expect(ctx.body.event_context).toMatchObject({
      event_id: eventId,
      picture_id: pictureId,
      target_location: { lng: 34.79, lat: 32.07 },
      image_path: 's3://field-images/evt/abc.png',
    });
    const ctxAircraft = ctx.body.aircraft_context.aircrafts.find(
      (a: { aircraft_id: string }) => a.aircraft_id === freeId,
    );
    expect(ctxAircraft).toMatchObject({ aircraft_type: 'F-15' });
    expect(ctxAircraft.path_history[0]).toMatchObject({ location: { lng: 34.8, lat: 32.1 } });

    // 5. AI recommendation (links to the event).
    const rec = await request(app)
      .post('/api/ai-recommendations')
      .set(auth)
      .send({
        event_id: eventId,
        recommended_aircraft_id: freeId,
        urgency_level: 0.92,
        raw_recommendation: 'Dispatch F-15 within 8 minutes.',
      });
    expect(rec.status).toBe(201);
    const recId = rec.body.ai_recommendation_id as string;
    expect(typeof recId).toBe('string');

    const linked = await testPrisma().event.findUnique({ where: { id: eventId }, select: { ai_recommendation_id: true } });
    expect(linked?.ai_recommendation_id).toBe(recId);

    // 6. PATCH event → { ok, update_date }.
    const patched = await request(app)
      .patch(`/api/events/${eventId}`)
      .set(auth)
      .send({ aircraft_id: freeId });
    expect(patched.body.ok).toBe(true);
    expect(typeof patched.body.update_date).toBe('string');

    // PATCH target status → { ok: true }.
    const patchedTarget = await request(app)
      .patch(`/api/targets/${targetId}`)
      .set(auth)
      .send({ status: 'destroyed' });
    expect(patchedTarget.body).toEqual({ ok: true });
  });

  it('serves aircraft list, live, path, track, batch and patch', async () => {
    const { aircraftId: freeId, typeId } = await seedAircraft(AircraftStatus.FREE, 34.78, 32.08);

    const listFree = await request(app).get('/api/aircraft?status=free').set(auth);
    expect(listFree.body.aircraft[0]).toMatchObject({ aircraft_id: freeId, aircraft_type: 'F-15', status: 'free' });

    const byType = await request(app).get(`/api/aircraft-types/${typeId}/aircraft?status=free`).set(auth);
    expect(byType.status).toBe(200);
    expect(byType.body.aircraft.some((a: { aircraft_id: string }) => a.aircraft_id === freeId)).toBe(true);

    const byTypeName = await request(app).get('/api/aircraft?type_name=F-15&status=free').set(auth);
    expect(byTypeName.body.aircraft.some((a: { aircraft_id: string }) => a.aircraft_id === freeId)).toBe(true);

    const live = await request(app).get('/api/aircraft/live').set(auth);
    const liveRow = live.body.aircraft.find((a: { aircraft_id: string }) => a.aircraft_id === freeId);
    expect(liveRow).toMatchObject({ aircraft_type: 'F-15', status: 'free', location: { lng: 34.78, lat: 32.08 } });

    const path = await request(app).get(`/api/aircraft/${freeId}/path?limit=10`).set(auth);
    expect(path.body).toMatchObject({ aircraft_id: freeId });
    expect(path.body.points[0]).toMatchObject({ location: { lng: 34.78, lat: 32.08 }, altitude: 1200 });

    const track = await request(app).get(`/api/aircraft/${freeId}/track`).set(auth);
    expect(track.body.points[0]).toMatchObject({ location: { lng: 34.78, lat: 32.08 } });

    const batch = await request(app)
      .post('/api/aircraft/path-history-batch')
      .set(auth)
      .send([
        { aircraft_id: freeId, location: { lng: 34.9, lat: 32.2 }, altitude: 1300, update_date: '2026-06-03T12:05:00Z' },
      ]);
    expect(batch.status).toBe(201);
    expect(batch.body).toEqual({ inserted: 1 });

    const patched = await request(app)
      .patch(`/api/aircraft/${freeId}`)
      .set(auth)
      .send({ status: 'busy' });
    expect(patched.body.ok).toBe(true);
    expect(typeof patched.body.update_date).toBe('string');
  });

  it('lists active polygons with the contract shape', async () => {
    await testPrisma().polygon.create({
      data: {
        name: 'Zone south',
        geojson: { type: 'Polygon', coordinates: [[[34.78, 32.07], [34.79, 32.08], [34.78, 32.07]]] },
        zone: Zone.GAZA_SOUTH,
        create_date: new Date('2026-06-03T12:00:00Z'),
        expiry_date: new Date('2026-06-03T12:30:00Z'),
      },
    });

    const res = await request(app).get('/api/polygons?active=true').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.polygons[0]).toMatchObject({
      name: 'Zone south',
      zone: 'gaza_south',
      state_duartion: 30,
    });
    expect(res.body.polygons[0].area).toMatchObject({ type: 'Polygon' });
  });

  it.skipIf(!hasObjectStorage)('uploads a picture in one multipart request', async () => {
    const res = await request(app)
      .post('/api/storage/pictures')
      .set(auth)
      .field('file_name', 'target-123.png')
      .attach('file', Buffer.from('fake-png-bytes'), 'target-123.png');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ file_name: 'target-123.png' });
    expect(typeof res.body.picture_id).toBe('string');
    expect(typeof res.body.object_key).toBe('string');
    expect(typeof res.body.bucket).toBe('string');
  });

  it('rejects an upload with no file (400)', async () => {
    const res = await request(app)
      .post('/api/storage/pictures')
      .set(auth)
      .field('file_name', 'target-123.png');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('returns the nested error envelope on 404', async () => {
    const res = await request(app)
      .get('/api/events/6ba7b810-9dad-11d1-80b4-00c04fd430c8')
      .set(auth);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(typeof res.body.error.message).toBe('string');
  });
});
