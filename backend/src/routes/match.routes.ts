import { Router } from 'express';
import { matchController } from '@controllers/match.controller';
import { validate } from '@middleware/validate';
import { authenticate, authorize } from '@middleware/auth';
import {
  tournamentIdParamSchema,
  matchIdParamSchema,
  listMatchesSchema,
  finishMatchSchema,
} from '@validators/match.validator';

export const nestedMatchRouter = Router();
nestedMatchRouter.use(authenticate);

nestedMatchRouter.get('/:id/rounds', validate(tournamentIdParamSchema), matchController.listRounds);
nestedMatchRouter.post(
  '/:id/rounds',
  authorize('SUPER_ADMIN', 'ADMIN', 'ORGANIZER'),
  validate(tournamentIdParamSchema),
  matchController.generateNextRound,
);
nestedMatchRouter.get('/:id/matches', validate(listMatchesSchema), matchController.listMatches);

const standaloneRouter = Router();
standaloneRouter.use(authenticate);

standaloneRouter.get('/:matchId', validate(matchIdParamSchema), matchController.getById);
standaloneRouter.post(
  '/:matchId/start',
  authorize('SUPER_ADMIN', 'ADMIN', 'ORGANIZER'),
  validate(matchIdParamSchema),
  matchController.start,
);
standaloneRouter.post(
  '/:matchId/pause',
  authorize('SUPER_ADMIN', 'ADMIN', 'ORGANIZER'),
  validate(matchIdParamSchema),
  matchController.pause,
);
standaloneRouter.post(
  '/:matchId/resume',
  authorize('SUPER_ADMIN', 'ADMIN', 'ORGANIZER'),
  validate(matchIdParamSchema),
  matchController.resume,
);
standaloneRouter.post(
  '/:matchId/finish',
  authorize('SUPER_ADMIN', 'ADMIN', 'ORGANIZER'),
  validate(finishMatchSchema),
  matchController.finish,
);

export default standaloneRouter;
