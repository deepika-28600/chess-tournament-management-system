import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { matchService } from '@services/match.service';
import { SOCKET_EVENTS } from '../socket';
import type { Server as SocketIOServer } from 'socket.io';

function getIo(req: Request): SocketIOServer | undefined {
  return req.app.get('io');
}

export const matchController = {
  generateNextRound: asyncHandler(async (req: Request, res: Response) => {
    const result = await matchService.generateNextRound(req.params.id);
    getIo(req)?.to(`tournament:${req.params.id}`).emit(SOCKET_EVENTS.ROUND_GENERATED, result.round);
    return ApiResponse.created(res, 'Round generated successfully', result);
  }),

  listRounds: asyncHandler(async (req: Request, res: Response) => {
    const rounds = await matchService.listRounds(req.params.id);
    return ApiResponse.ok(res, 'Rounds fetched successfully', rounds);
  }),

  listMatches: asyncHandler(async (req: Request, res: Response) => {
    const round = req.query.round ? Number(req.query.round) : undefined;
    const matches = await matchService.listByTournament(req.params.id, round);
    return ApiResponse.ok(res, 'Matches fetched successfully', matches);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const match = await matchService.getById(req.params.matchId);
    return ApiResponse.ok(res, 'Match fetched successfully', match);
  }),

  start: asyncHandler(async (req: Request, res: Response) => {
    const match = await matchService.startMatch(req.params.matchId);
    getIo(req)?.to(`tournament:${match.tournamentId}`).emit(SOCKET_EVENTS.MATCH_STARTED, match);
    return ApiResponse.ok(res, 'Match started', match);
  }),

  pause: asyncHandler(async (req: Request, res: Response) => {
    const match = await matchService.pauseMatch(req.params.matchId);
    getIo(req)?.to(`tournament:${match.tournamentId}`).emit(SOCKET_EVENTS.MATCH_UPDATED, match);
    return ApiResponse.ok(res, 'Match paused', match);
  }),

  resume: asyncHandler(async (req: Request, res: Response) => {
    const match = await matchService.resumeMatch(req.params.matchId);
    getIo(req)?.to(`tournament:${match.tournamentId}`).emit(SOCKET_EVENTS.MATCH_UPDATED, match);
    return ApiResponse.ok(res, 'Match resumed', match);
  }),

  finish: asyncHandler(async (req: Request, res: Response) => {
    const match = await matchService.finishMatch(req.params.matchId, req.body);
    getIo(req)?.to(`tournament:${match.tournamentId}`).emit(SOCKET_EVENTS.MATCH_FINISHED, match);
    return ApiResponse.ok(res, 'Match finished', match);
  }),
};
