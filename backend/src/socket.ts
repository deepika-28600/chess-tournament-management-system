import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '@config/logger';

export const SOCKET_EVENTS = {
  JOIN_TOURNAMENT: 'tournament:join',
  LEAVE_TOURNAMENT: 'tournament:leave',
  MATCH_UPDATED: 'match:updated',
  MATCH_STARTED: 'match:started',
  MATCH_FINISHED: 'match:finished',
  SCOREBOARD_UPDATE: 'scoreboard:update',
  NOTIFICATION_NEW: 'notification:new',
  ROUND_GENERATED: 'round:generated',
} as const;

export function registerSocketHandlers(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    socket.on(SOCKET_EVENTS.JOIN_TOURNAMENT, (tournamentId: string) => {
      socket.join(`tournament:${tournamentId}`);
    });

    socket.on(SOCKET_EVENTS.LEAVE_TOURNAMENT, (tournamentId: string) => {
      socket.leave(`tournament:${tournamentId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });
}

/**
 * Helper for services/controllers to broadcast a live match update
 * to everyone watching a given tournament room.
 */
export function broadcastMatchUpdate(io: SocketIOServer, tournamentId: string, payload: unknown): void {
  io.to(`tournament:${tournamentId}`).emit(SOCKET_EVENTS.MATCH_UPDATED, payload);
}
