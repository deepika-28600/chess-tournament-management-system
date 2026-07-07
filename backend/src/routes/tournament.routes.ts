import { Router } from 'express';
import { tournamentController } from '@controllers/tournament.controller';
import { validate } from '@middleware/validate';
import { authenticate, authorize } from '@middleware/auth';
import {
  createTournamentSchema,
  updateTournamentSchema,
  listTournamentsSchema,
  idParamSchema,
  registerPlayersSchema,
  removePlayerSchema,
} from '@validators/tournament.validator';

const router = Router();

router.use(authenticate);

router.get('/', validate(listTournamentsSchema), tournamentController.list);
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'ORGANIZER'),
  validate(createTournamentSchema),
  tournamentController.create,
);

router.get('/:id', validate(idParamSchema), tournamentController.getById);
router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'ORGANIZER'),
  validate(updateTournamentSchema),
  tournamentController.update,
);
router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate(idParamSchema),
  tournamentController.remove,
);

router.get('/:id/registrations', validate(idParamSchema), tournamentController.listRegistrations);
router.post(
  '/:id/registrations',
  authorize('SUPER_ADMIN', 'ADMIN', 'ORGANIZER'),
  validate(registerPlayersSchema),
  tournamentController.registerPlayers,
);
router.delete(
  '/:id/registrations/:playerId',
  authorize('SUPER_ADMIN', 'ADMIN', 'ORGANIZER'),
  validate(removePlayerSchema),
  tournamentController.removePlayer,
);

export default router;
