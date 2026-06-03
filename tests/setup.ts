/**
 * Global test setup. Vitest sets NODE_ENV=test by default.
 *
 * Integration tests (anything importing tests/helpers/db.ts) require a DEDICATED
 * test database in DATABASE_URL. As a safety rail, that helper refuses to run
 * against the known shared/production host. Tests that need a DB skip
 * themselves when one is not configured — see `hasTestDb` in tests/helpers/db.ts.
 */
import { beforeAll } from 'vitest';

beforeAll(() => {
  if (process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'test';
  }
});
