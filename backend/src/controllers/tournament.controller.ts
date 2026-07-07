import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { tournamentService } from '@services/tournament.service';
import { ApiError } from '@utils/ApiError';

export const tournamentController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const tournament = await tournamentService.create(req.body, req.user.userId);
    return ApiResponse.created(res, 'Tournament created successfully', tournament);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      type?: string;
      status?: string;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
    };
    const { items, pagination } = await tournamentService.list(query);
    return ApiResponse.ok(res, 'Tournaments fetched successfully', items, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const tournament = await tournamentService.getById(req.params.id);
    return ApiResponse.ok(res, 'Tournament fetched successfully', tournament);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const tournament = await tournamentService.update(req.params.id, req.body);
    return ApiResponse.ok(res, 'Tournament updated successfully', tournament);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await tournamentService.softDelete(req.params.id);
    return ApiResponse.ok(res, 'Tournament deleted successfully');
  }),

  registerPlayers: asyncHandler(async (req: Request, res: Response) => {
    const result = await tournamentService.registerPlayers(req.params.id, req.body.playerIds);
    return ApiResponse.ok(res, 'Registration processed successfully', result);
  }),

  removePlayer: asyncHandler(async (req: Request, res: Response) => {
    const result = await tournamentService.removePlayer(req.params.id, req.params.playerId);
    return ApiResponse.ok(res, 'Player removed from tournament', result);
  }),

  listRegistrations: asyncHandler(async (req: Request, res: Response) => {
    const registrations = await tournamentService.listRegistrations(req.params.id);
    return ApiResponse.ok(res, 'Registrations fetched successfully', registrations);
  }),
};
