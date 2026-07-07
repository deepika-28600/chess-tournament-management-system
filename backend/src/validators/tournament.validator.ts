import { z } from 'zod';

const typeEnum = z.enum([
  'KNOCKOUT',
  'LEAGUE',
  'ROUND_ROBIN',
  'SWISS',
  'RAPID',
  'BLITZ',
  'CLASSICAL',
]);
const statusEnum = z.enum(['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED']);

const dateRangeRefinement = <
  T extends { startDate?: string | Date; endDate?: string | Date },
>(
  data: T,
  ctx: z.RefinementCtx,
) => {
  if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'endDate must be on or after startDate',
      path: ['endDate'],
    });
  }
};

export const createTournamentSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150),
      description: z.string().trim().max(2000).optional(),
      location: z.string().trim().min(2).max(150),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      maxPlayers: z.coerce.number().int().min(2, 'Must allow at least 2 players').max(2048),
      entryFee: z.coerce.number().min(0).optional().default(0),
      prizePool: z.coerce.number().min(0).optional().default(0),
      type: typeEnum,
      bannerUrl: z.string().url().optional(),
    })
    .superRefine(dateRangeRefinement),
});

export const updateTournamentSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid tournament id') }),
  body: z
    .object({
      name: z.string().trim().min(3).max(150).optional(),
      description: z.string().trim().max(2000).optional(),
      location: z.string().trim().min(2).max(150).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      maxPlayers: z.coerce.number().int().min(2).max(2048).optional(),
      entryFee: z.coerce.number().min(0).optional(),
      prizePool: z.coerce.number().min(0).optional(),
      type: typeEnum.optional(),
      bannerUrl: z.string().url().optional(),
      status: statusEnum.optional(),
    })
    .superRefine(dateRangeRefinement),
});

export const listTournamentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().trim().optional(),
    type: typeEnum.optional(),
    status: statusEnum.optional(),
    sortBy: z
      .enum(['name', 'startDate', 'endDate', 'maxPlayers', 'createdAt'])
      .optional()
      .default('startDate'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid tournament id') }),
});

export const registerPlayersSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid tournament id') }),
  body: z.object({
    playerIds: z.array(z.string().uuid()).min(1, 'Provide at least one player id'),
  }),
});

export const removePlayerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid tournament id'),
    playerId: z.string().uuid('Invalid player id'),
  }),
});
