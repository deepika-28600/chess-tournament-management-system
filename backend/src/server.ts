import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { env } from '@config/env';
import { connectDatabase, disconnectDatabase } from '@config/prisma';
import { logger } from '@config/logger';
import { registerSocketHandlers } from './socket';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  logger.info('✅ Database connected');

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(','),
      credentials: true,
    },
  });

  registerSocketHandlers(io);
  app.set('io', io);

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`📚 API docs available at http://localhost:${env.PORT}/api-docs`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    httpServer.close(async () => {
      await disconnectDatabase();
      logger.info('Cleanup complete. Exiting.');
      process.exit(0);
    });
    // Force-exit if shutdown hangs
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason as Error);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
