import { z } from 'zod';

export const tournamentIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid tournament id') }),
});

export const matchIdParamSchema = z.object({
  params: z.object({ matchId: z.string().uuid('Invalid match id') }),
});

export const listMatchesSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid tournament id') }),
  query: z.object({
    round: z.coerce.number().int().min(1).optional(),
  }),
});

export const finishMatchSchema = z.object({
  params: z.object({ matchId: z.string().uuid('Invalid match id') }),
  body: z.object({
    result: z.enum(['PLAYER_A_WIN', 'PLAYER_B_WIN', 'DRAW', 'WALKOVER_A', 'WALKOVER_B']),
    scoreA: z.coerce.number().min(0).max(1),
    scoreB: z.coerce.number().min(0).max(1),
    remarks: z.string().trim().max(500).optional(),
  }),
});
