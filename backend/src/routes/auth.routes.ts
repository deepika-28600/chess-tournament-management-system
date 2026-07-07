import { Router } from 'express';
import { authController } from '@controllers/auth.controller';
import { validate } from '@middleware/validate';
import { authenticate } from '@middleware/auth';
import { authRateLimiter } from '@middleware/security';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
} from '@validators/auth.validator';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new admin account
 *     responses:
 *       201: { description: Account created }
 */
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and receive access + refresh tokens
 *     responses:
 *       200: { description: Login successful }
 */
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token for a new access token
 */
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Invalidate the current session
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using a valid reset token
 */
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password while authenticated
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Get the logged-in admin's profile
 *   patch:
 *     tags: [Auth]
 *     summary: Update the logged-in admin's profile
 */
router.get('/profile', authenticate, authController.getProfile);
router.patch('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);

export default router;
