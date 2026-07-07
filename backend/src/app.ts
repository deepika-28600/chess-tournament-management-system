import express, { Express } from 'express';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { applySecurityMiddleware } from '@middleware/security';
import { errorHandler, notFoundHandler } from '@middleware/errorHandler';
import { logger } from '@config/logger';
import { swaggerSpec } from '@config/swagger';
import { isDevelopment } from '@config/env';
import apiRouter from '@routes/index';

export function createApp(): Express {
  const app = express();

  applySecurityMiddleware(app);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  if (isDevelopment) {
    app.use(morgan('dev', { stream: { write: (msg) => logger.debug(msg.trim()) } }));
  }

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
