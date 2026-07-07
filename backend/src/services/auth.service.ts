import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@config/prisma';
import { ApiError } from '@utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@utils/jwt';
import { logger } from '@config/logger';

const SALT_ROUNDS = 12;

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZER';
}

interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role ?? 'ADMIN',
        settings: { create: {} },
      },
    });

    logger.info(`New user registered: ${user.email}`);

    return sanitizeUser(user);
  },

  async login(input: LoginInput, meta: { ipAddress?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id });
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash, lastLoginAt: new Date() },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entityType: 'User',
          entityId: user.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      }),
    ]);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.refreshTokenHash) {
      throw ApiError.unauthorized('Session no longer valid, please log in again');
    }

    const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    if (incomingHash !== user.refreshTokenHash) {
      throw ApiError.unauthorized('Session no longer valid, please log in again');
    }

    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ userId: user.id });
    const newRefreshHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newRefreshHash },
    });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Do not reveal whether the email exists - always respond the same way at the controller level
    if (!user) return null;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash, resetTokenExpiry },
    });

    // In production this would be emailed via a transactional email provider.
    logger.info(`Password reset token generated for ${email}`);

    return resetToken;
  },

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw ApiError.badRequest('Reset link is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiry: null,
        refreshTokenHash: null, // force re-login on all devices
      },
    });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');
    return sanitizeUser(user);
  },

  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    const user = await prisma.user.update({ where: { id: userId }, data });
    return sanitizeUser(user);
  },
};
