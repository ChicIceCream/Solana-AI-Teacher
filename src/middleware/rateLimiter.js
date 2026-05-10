import rateLimit from 'express-rate-limit';
import config from '../../config/index.js';

/**
 * General API rate limiter.
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
});

/**
 * Stricter limiter for wallet creation / airdrop (expensive operations).
 */
export const walletLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many wallet/airdrop requests. Please wait a moment.',
    },
  },
});

/**
 * AI endpoint limiter (Gemini API has its own limits).
 */
export const aiLimiter = rateLimit({
  windowMs: 60000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many AI requests. Please wait a moment.',
    },
  },
});

export default { apiLimiter, walletLimiter, aiLimiter };
