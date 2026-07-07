import { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { env } from '@config/env';

export function applySecurityMiddleware(app: Express): void {
  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS - restrict to configured frontend origin, allow credentials for cookies
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(','),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Gzip compression
  app.use(compression());

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Note: we deliberately don't use the unmaintained `xss-clean` package here.
  // This API returns JSON only (never renders raw HTML), all input is validated
  // and coerced through Zod schemas, Prisma uses parameterized queries (no string-built
  // SQL), and the React frontend auto-escapes all rendered content by default -
  // together these cover the XSS/injection surface without an abandoned dependency.

  // Global rate limiter
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests, please try again later.' },
    }),
  );
}

// Stricter limiter specifically for auth endpoints (login/register/forgot-password)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});
