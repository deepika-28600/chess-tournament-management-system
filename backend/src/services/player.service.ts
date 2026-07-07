import { Prisma } from '@prisma/client';
import { prisma } from '@config/prisma';
import { ApiError } from '@utils/ApiError';
import { buildPagination } from '@utils/ApiResponse';

interface CreatePlayerInput {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  country: string;
  state?: string;
  city?: string;
  email: string;
  phone: string;
  fideRating?: number;
  experienceYears?: number;
  photoUrl?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED';
}

interface ListPlayersQuery {
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
}

async function generatePlayerCode(): Promise<string> {
  const count = await prisma.player.count();
  const next = count + 1;
  return `PLY-${String(next).padStart(6, '0')}`;
}

export const playerService = {
  async create(input: CreatePlayerInput) {
    const [emailExists, phoneExists] = await Promise.all([
      prisma.player.findUnique({ where: { email: input.email } }),
      prisma.player.findUnique({ where: { phone: input.phone } }),
    ]);

    if (emailExists) throw ApiError.conflict('A player with this email already exists');
    if (phoneExists) throw ApiError.conflict('A player with this phone number already exists');

    const playerCode = await generatePlayerCode();

    return prisma.player.create({
      data: { ...input, playerCode },
    });
  },

  async list(query: ListPlayersQuery) {
    const { page, limit, search, country, status, gender, minRating, maxRating, sortBy, sortOrder } =
      query;

    const where: Prisma.PlayerWhereInput = {
      isDeleted: false,
      ...(country ? { country: { equals: country, mode: 'insensitive' } } : {}),
      ...(status ? { status: status as Prisma.EnumPlayerStatusFilter['equals'] } : {}),
      ...(gender ? { gender: gender as Prisma.EnumGenderFilter['equals'] } : {}),
      ...(minRating !== undefined || maxRating !== undefined
        ? {
            fideRating: {
              ...(minRating !== undefined ? { gte: minRating } : {}),
              ...(maxRating !== undefined ? { lte: maxRating } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { playerCode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.player.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.player.count({ where }),
    ]);

    return { items, pagination: buildPagination(page, limit, total) };
  },

  async getById(id: string) {
    const player = await prisma.player.findFirst({ where: { id, isDeleted: false } });
    if (!player) throw ApiError.notFound('Player not found');
    return player;
  },

  async getMatchHistory(id: string) {
    await this.getById(id);
    return prisma.match.findMany({
      where: { OR: [{ playerAId: id }, { playerBId: id }] },
      include: {
        playerA: { select: { id: true, name: true, photoUrl: true } },
        playerB: { select: { id: true, name: true, photoUrl: true } },
        tournament: { select: { id: true, name: true } },
        round: { select: { roundNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async update(id: string, data: Partial<CreatePlayerInput>) {
    await this.getById(id);

    if (data.email) {
      const existing = await prisma.player.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== id) throw ApiError.conflict('Email already in use by another player');
    }
    if (data.phone) {
      const existing = await prisma.player.findUnique({ where: { phone: data.phone } });
      if (existing && existing.id !== id) throw ApiError.conflict('Phone already in use by another player');
    }

    return prisma.player.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    await this.getById(id);
    return prisma.player.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },

  async restore(id: string) {
    const player = await prisma.player.findFirst({ where: { id, isDeleted: true } });
    if (!player) throw ApiError.notFound('Deleted player not found in recycle bin');
    return prisma.player.update({ where: { id }, data: { isDeleted: false, deletedAt: null } });
  },

  async listRecycleBin(page: number, limit: number) {
    const where: Prisma.PlayerWhereInput = { isDeleted: true };
    const [items, total] = await prisma.$transaction([
      prisma.player.findMany({
        where,
        orderBy: { deletedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.player.count({ where }),
    ]);
    return { items, pagination: buildPagination(page, limit, total) };
  },

  async permanentlyDelete(id: string) {
    const player = await prisma.player.findFirst({ where: { id, isDeleted: true } });
    if (!player) throw ApiError.notFound('Deleted player not found in recycle bin');
    return prisma.player.delete({ where: { id } });
  },

  async bulkDelete(ids: string[]) {
    return prisma.player.updateMany({
      where: { id: { in: ids } },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },

  async getStatistics(id: string) {
    const player = await this.getById(id);
    const totalMatches = player.wins + player.losses + player.draws;
    const winRate = totalMatches > 0 ? (player.wins / totalMatches) * 100 : 0;

    const tournamentsPlayed = await prisma.tournamentPlayer.count({ where: { playerId: id } });

    return {
      totalMatches,
      wins: player.wins,
      losses: player.losses,
      draws: player.draws,
      winRate: Math.round(winRate * 100) / 100,
      fideRating: player.fideRating,
      currentRank: player.currentRank,
      tournamentsPlayed,
    };
  },
};
