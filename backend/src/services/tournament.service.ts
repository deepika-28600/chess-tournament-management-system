import { Prisma, TournamentStatus, TournamentType } from '@prisma/client';
import { prisma } from '@config/prisma';
import { ApiError } from '@utils/ApiError';
import { buildPagination } from '@utils/ApiResponse';

interface CreateTournamentInput {
  name: string;
  description?: string;
  location: string;
  startDate: Date;
  endDate: Date;
  maxPlayers: number;
  entryFee?: number;
  prizePool?: number;
  type: TournamentType;
  bannerUrl?: string;
}

interface ListTournamentsQuery {
  page: number;
  limit: number;
  search?: string;
  type?: string;
  status?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') +
    '-' +
    Date.now().toString(36)
  );
}

export const tournamentService = {
  async create(input: CreateTournamentInput, organizerId: string) {
    const slug = slugify(input.name);
    return prisma.tournament.create({
      data: { ...input, slug, organizerId },
    });
  },

  async list(query: ListTournamentsQuery) {
    const { page, limit, search, type, status, sortBy, sortOrder } = query;

    const where: Prisma.TournamentWhereInput = {
      isDeleted: false,
      ...(type ? { type: type as TournamentType } : {}),
      ...(status ? { status: status as TournamentStatus } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { location: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.tournament.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { registrations: true, matches: true } },
          organizer: { select: { id: true, name: true } },
        },
      }),
      prisma.tournament.count({ where }),
    ]);

    return { items, pagination: buildPagination(page, limit, total) };
  },

  async getById(id: string) {
    const tournament = await prisma.tournament.findFirst({
      where: { id, isDeleted: false },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        _count: { select: { registrations: true, matches: true, rounds: true } },
      },
    });
    if (!tournament) throw ApiError.notFound('Tournament not found');
    return tournament;
  },

  async update(id: string, data: Partial<CreateTournamentInput> & { status?: TournamentStatus }) {
    await this.getById(id);
    return prisma.tournament.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    await this.getById(id);
    return prisma.tournament.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },

  async registerPlayers(tournamentId: string, playerIds: string[]) {
    const tournament = await this.getById(tournamentId);

    const existingPlayers = await prisma.player.findMany({
      where: { id: { in: playerIds }, isDeleted: false },
      select: { id: true },
    });
    const validIds = existingPlayers.map((p) => p.id);
    const invalidIds = playerIds.filter((id) => !validIds.includes(id));
    if (invalidIds.length > 0) {
      throw ApiError.badRequest('Some player ids do not exist', { invalidIds });
    }

    const alreadyRegistered = await prisma.tournamentPlayer.findMany({
      where: { tournamentId, playerId: { in: validIds } },
      select: { playerId: true },
    });
    const alreadyRegisteredIds = new Set(alreadyRegistered.map((r) => r.playerId));
    const toRegister = validIds.filter((id) => !alreadyRegisteredIds.has(id));

    if (toRegister.length === 0) {
      throw ApiError.conflict('All selected players are already registered for this tournament');
    }

    const confirmedCount = await prisma.tournamentPlayer.count({
      where: { tournamentId, status: 'CONFIRMED' },
    });

    const availableSlots = Math.max(0, tournament.maxPlayers - confirmedCount);
    const confirmedIds = toRegister.slice(0, availableSlots);
    const waitlistIds = toRegister.slice(availableSlots);

    const created = await prisma.$transaction([
      ...(confirmedIds.length > 0
        ? [
            prisma.tournamentPlayer.createMany({
              data: confirmedIds.map((playerId) => ({
                tournamentId,
                playerId,
                status: 'CONFIRMED' as const,
              })),
            }),
          ]
        : []),
      ...(waitlistIds.length > 0
        ? [
            prisma.tournamentPlayer.createMany({
              data: waitlistIds.map((playerId) => ({
                tournamentId,
                playerId,
                status: 'WAITING_LIST' as const,
              })),
            }),
          ]
        : []),
    ]);

    return {
      confirmed: confirmedIds,
      waitlisted: waitlistIds,
      alreadyRegistered: Array.from(alreadyRegisteredIds),
      summary: created,
    };
  },

  async removePlayer(tournamentId: string, playerId: string) {
    const registration = await prisma.tournamentPlayer.findUnique({
      where: { unique_registration: { tournamentId, playerId } },
    });
    if (!registration) throw ApiError.notFound('Registration not found');

    await prisma.tournamentPlayer.delete({
      where: { unique_registration: { tournamentId, playerId } },
    });

    if (registration.status === 'CONFIRMED') {
      const nextInLine = await prisma.tournamentPlayer.findFirst({
        where: { tournamentId, status: 'WAITING_LIST' },
        orderBy: { registeredAt: 'asc' },
      });
      if (nextInLine) {
        await prisma.tournamentPlayer.update({
          where: { id: nextInLine.id },
          data: { status: 'CONFIRMED' },
        });
      }
    }

    return { removed: playerId };
  },

  async listRegistrations(tournamentId: string) {
    await this.getById(tournamentId);
    return prisma.tournamentPlayer.findMany({
      where: { tournamentId },
      include: { player: true },
      orderBy: [{ status: 'asc' }, { registeredAt: 'asc' }],
    });
  },
};
