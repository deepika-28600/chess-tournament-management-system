import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { authService } from '@services/auth.service';
import { ApiError } from '@utils/ApiError';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.register(req.body);
    return ApiResponse.created(res, 'Account created successfully', user);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return ApiResponse.ok(res, 'Login successful', result);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refresh(refreshToken);
    return ApiResponse.ok(res, 'Token refreshed', tokens);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await authService.logout(req.user.userId);
    return ApiResponse.ok(res, 'Logged out successfully');
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const token = await authService.forgotPassword(req.body.email);
    // Always return a generic success message to prevent email enumeration.
    // The token is only included here in non-production for demo/testing convenience.
    return ApiResponse.ok(res, 'If an account exists with this email, a reset link has been sent', {
      ...(process.env.NODE_ENV !== 'production' && token ? { devResetToken: token } : {}),
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    return ApiResponse.ok(res, 'Password has been reset successfully. Please log in again.');
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.userId, currentPassword, newPassword);
    return ApiResponse.ok(res, 'Password changed successfully');
  }),

  getProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const profile = await authService.getProfile(req.user.userId);
    return ApiResponse.ok(res, 'Profile fetched successfully', profile);
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const profile = await authService.updateProfile(req.user.userId, req.body);
    return ApiResponse.ok(res, 'Profile updated successfully', profile);
  }),
};
