/**
 * Lightweight logger utility
 * - In production: only error and warn are output
 * - In development: all levels are output
 */
const isProduction = process.env.NODE_ENV === 'production';

const logger = {
  /** Informational messages — suppressed in production */
  info: (...args) => {
    if (!isProduction) {
      console.log('[INFO]', ...args);
    }
  },

  /** Debug messages — suppressed in production */
  debug: (...args) => {
    if (!isProduction) {
      console.log('[DEBUG]', ...args);
    }
  },

  /** Warnings — always output */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /** Errors — always output */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
};

module.exports = logger;
