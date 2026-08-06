const pino = require('pino');

// Use plain JSON logger on Vercel (no worker threads available).
// Use pino-pretty only in local development when explicitly requested.
const useDevLogger =
  process.env.NODE_ENV === 'development' &&
  process.env.VERCEL !== '1' &&
  process.env.LOG_PRETTY === 'true';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(useDevLogger
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
});

module.exports = logger;
