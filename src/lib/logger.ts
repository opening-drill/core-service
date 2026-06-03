import { pino, type Logger } from 'pino';

import { env, isProduction } from '../config/env.js';

/**
 * Application-wide structured logger.
 * Pretty-prints in non-production for readability; emits JSON in production.
 */
const usePretty = !isProduction && !process.env.VERCEL;

export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  ...(usePretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});
