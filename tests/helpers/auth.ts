/** Builds the `X-Api-Key` header (env `API_KEY`). */
export function apiKeyHeader(apiKey: string): Record<string, string> {
  return { 'X-Api-Key': apiKey };
}

/** Test API key from vitest.config.ts `env.API_KEY`. */
export const TEST_API_KEY = 'test-api-key-16chars';
