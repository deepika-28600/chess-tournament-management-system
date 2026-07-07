import { PrismaClient } from '@prisma/client';
import { isDevelopment } from './env';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevent creating multiple PrismaClient instances during dev hot-reload
export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isDevelopment ? ['warn', 'error'] : ['error'],
  });

if (isDevelopment) {
  global.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
