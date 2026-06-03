import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    // Quiet the request logger during tests (validated enum value).
    env: {
      LOG_LEVEL: 'silent',
      API_KEY: 'test-api-key-16chars',
      SIGNUP_DEFAULT_ROLE_NAME: 'viewer',
    },
    // DB-backed integration tests share one database — run files serially to
    // avoid cross-test contention during truncation/reset.
    pool: 'forks',
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
    setupFiles: ['tests/setup.ts'],
  },
});
