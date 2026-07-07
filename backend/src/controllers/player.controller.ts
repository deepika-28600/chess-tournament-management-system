import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { playerService } from '@services/player.service';
import { ApiError } from '@utils/ApiError';

export const playerController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const player = await playerService.create(req.body);
    return ApiResponse.created(res, 'Player created successfully', player);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      country?: string;
      status?: string;
      gender?: string;
      minRating?: number;
      maxRating?: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
    };
    const { items, pagination } = await playerService.list(query);
    return ApiResponse.ok(res, 'Players fetched successfully', items, pagination);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const player = await playerService.getById(req.params.id);
    return ApiResponse.ok(res, 'Player fetched successfully', player);
  }),

  getMatchHistory: asyncHandler(async (req: Request, res: Response) => {
    const history = await playerService.getMatchHistory(req.params.id);
    return ApiResponse.ok(res, 'Match history fetched successfully', history);
  }),

  getStatistics: asyncHandler(async (req: Request, res: Response) => {
    const stats = await playerService.getStatistics(req.params.id);
    return ApiResponse.ok(res, 'Player statistics fetched successfully', stats);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const player = await playerService.update(req.params.id, req.body);
    return ApiResponse.ok(res, 'Player updated successfully', player);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await playerService.softDelete(req.params.id);
    return ApiResponse.ok(res, 'Player moved to recycle bin');
  }),

  restore: asyncHandler(async (req: Request, res: Response) => {
    const player = await playerService.restore(req.params.id);
    return ApiResponse.ok(res, 'Player restored successfully', player);
  }),

  listRecycleBin: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const { items, pagination } = await playerService.listRecycleBin(page, limit);
    return ApiResponse.ok(res, 'Recycle bin fetched successfully', items, pagination);
  }),

  permanentlyDelete: asyncHandler(async (req: Request, res: Response) => {
    await playerService.permanentlyDelete(req.params.id);
    return ApiResponse.ok(res, 'Player permanently deleted');
  }),

  bulkDelete: asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      throw ApiError.badRequest('ids must be a non-empty array');
    }
    const result = await playerService.bulkDelete(ids);
    return ApiResponse.ok(res, `${result.count} player(s) moved to recycle bin`);
  }),
};
