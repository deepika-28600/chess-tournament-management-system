import { Router } from 'express';
import { playerController } from '@controllers/player.controller';
import { validate } from '@middleware/validate';
import { authenticate, authorize } from '@middleware/auth';
import {
  createPlayerSchema,
  updatePlayerSchema,
  listPlayersSchema,
  idParamSchema,
} from '@validators/player.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /players:
 *   get:
 *     tags: [Players]
 *     summary: List players with search, filter, sort, and pagination
 *   post:
 *     tags: [Players]
 *     summary: Create a new player
 */
router.get('/', validate(listPlayersSchema), playerController.list);
router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'ORGANIZER'), validate(createPlayerSchema), playerController.create);

/**
 * @openapi
 * /players/recycle-bin:
 *   get:
 *     tags: [Players]
 *     summary: List soft-deleted players
 */
router.get('/recycle-bin', authorize('SUPER_ADMIN', 'ADMIN'), playerController.listRecycleBin);

/**
 * @openapi
 * /players/bulk-delete:
 *   post:
 *     tags: [Players]
 *     summary: Soft-delete multiple players at once
 */
router.post('/bulk-delete', authorize('SUPER_ADMIN', 'ADMIN'), playerController.bulkDelete);

/**
 * @openapi
 * /players/{id}:
 *   get:
 *     tags: [Players]
 *     summary: Get a single player by id
 *   patch:
 *     tags: [Players]
 *     summary: Update a player
 *   delete:
 *     tags: [Players]
 *     summary: Soft-delete a player (moves to recycle bin)
 */
router.get('/:id', validate(idParamSchema), playerController.getById);
router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'ORGANIZER'),
  validate(updatePlayerSchema),
  playerController.update,
);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), validate(idParamSchema), playerController.remove);

router.get('/:id/match-history', validate(idParamSchema), playerController.getMatchHistory);
router.get('/:id/statistics', validate(idParamSchema), playerController.getStatistics);

router.post(
  '/:id/restore',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate(idParamSchema),
  playerController.restore,
);
router.delete(
  '/:id/permanent',
  authorize('SUPER_ADMIN'),
  validate(idParamSchema),
  playerController.permanentlyDelete,
);

export default router;
