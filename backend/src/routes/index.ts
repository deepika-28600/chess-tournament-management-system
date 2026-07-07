import { Router } from 'express';
import authRoutes from './auth.routes';
import playerRoutes from './player.routes';
import tournamentRoutes from './tournament.routes';
import matchRoutes, { nestedMatchRouter } from './match.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/players', playerRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/tournaments', nestedMatchRouter);
router.use('/matches', matchRoutes);

export default router;
