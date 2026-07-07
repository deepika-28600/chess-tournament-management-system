import { MatchStatus, MatchResult } from '@prisma/client';
import { prisma } from '@config/prisma';
import { ApiError } from '@utils/ApiError';
import {
  generateRoundRobinSchedule,
  generateKnockoutBracket,
  generateSwissRound,
  PairablePlayer,
} from './pairing.engine';

export const matchService = {
  async generateNextRound(tournamentId: string) {
    const tournament = await prisma.tournament.findFirst({ where: { id: tournamentId, isDeleted: false } });
    if (!tournament) throw ApiError.notFound('Tournament not found');

    const confirmedRegistrations = await prisma.tournamentPlayer.findMany({
      where: { tournamentId, status: 'CONFIRMED' },
      include: { player: true },
    });

    if (confirmedRegistrations.length < 2) {
      throw ApiError.badRequest('At least 2 confirmed players are required to generate a round');
    }

    const lastRound = await prisma.round.findFirst({
      where: { tournamentId },
      orderBy: { roundNumber: 'desc' },
    });

    if (lastRound && lastRound.status !== 'COMPLETED') {
      throw ApiError.conflict('The current round must be completed before generating the next one');
    }

    const nextRoundNumber = (lastRound?.roundNumber ?? 0) + 1;
    const players: PairablePlayer[] = confirmedRegistrations.map((r) => ({
      id: r.playerId,
      rating: r.player.fideRating,
    }));

    let pairings;

    if (tournament.type === 'KNOCKOUT') {
      if (nextRoundNumber > 1) {
        throw ApiError.badRequest(
          'Knockout subsequent rounds must be generated from winners via /advance-knockout',
        );
      }
      pairings = generateKnockoutBracket(players);
    } else if (tournament.type === 'ROUND_ROBIN' || tournament.type === 'LEAGUE') {
      const schedule = generateRoundRobinSchedule(players);
      if (nextRoundNumber > schedule.length) {
        throw ApiError.badRequest('All round-robin rounds have already been generated');
      }
      pairings = schedule[nextRoundNumber - 1];
    } else {
      const results = await prisma.result.findMany({ where: { tournamentId } });
      const pointsMap = new Map<string, number>();
      const opponentsMap = new Map<string, string[]>();

      for (const r of results) {
        pointsMap.set(r.playerId, (pointsMap.get(r.playerId) ?? 0) + r.points);
      }

      const priorMatches = await prisma.match.findMany({ where: { tournamentId, status: 'COMPLETED' } });
      for (const m of priorMatches) {
        if (m.playerAId && m.playerBId) {
          opponentsMap.set(m.playerAId, [...(opponentsMap.get(m.playerAId) ?? []), m.playerBId]);
          opponentsMap.set(m.playerBId, [...(opponentsMap.get(m.playerBId) ?? []), m.playerAId]);
        }
      }

      const standings = players.map((p) => ({
        playerId: p.id,
        rating: p.rating,
        points: pointsMap.get(p.id) ?? 0,
        opponentsFaced: opponentsMap.get(p.id) ?? [],
      }));

      pairings = generateSwissRound(standings);
    }

    const round = await prisma.round.create({
      data: { tournamentId, roundNumber: nextRoundNumber, status: 'PENDING' },
    });

    const matches = await prisma.$transaction(
      pairings.map((p, index) =>
        prisma.match.create({
          data: {
            tournamentId,
            roundId: round.id,
            playerAId: p.playerAId,
            playerBId: p.playerBId,
            isBye: p.isBye,
            boardNumber: index + 1,
            status: p.isBye ? 'COMPLETED' : 'SCHEDULED',
            result: p.isBye ? 'WALKOVER_A' : 'PENDING',
            winnerId: p.isBye ? p.playerAId : null,
            scoreA: p.isBye ? 1 : 0,
          },
        }),
      ),
    );

    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { totalRounds: nextRoundNumber, status: 'LIVE' },
    });

    return { round, matches };
  },

  async startMatch(matchId: string) {
    const match = await this.getById(matchId);
    if (match.status !== 'SCHEDULED' && match.status !== 'PAUSED') {
      throw ApiError.badRequest('Only scheduled or paused matches can be started');
    }
    return prisma.match.update({
      where: { id: matchId },
      data: { status: 'LIVE', startedAt: match.startedAt ?? new Date() },
    });
  },

  async pauseMatch(matchId: string) {
    const match = await this.getById(matchId);
    if (match.status !== 'LIVE') throw ApiError.badRequest('Only live matches can be paused');
    return prisma.match.update({ where: { id: matchId }, data: { status: 'PAUSED', pausedAt: new Date() } });
  },

  async resumeMatch(matchId: string) {
    const match = await this.getById(matchId);
    if (match.status !== 'PAUSED') throw ApiError.badRequest('Only paused matches can be resumed');
    return prisma.match.update({ where: { id: matchId }, data: { status: 'LIVE', pausedAt: null } });
  },

  async finishMatch(
    matchId: string,
    input: { result: MatchResult; scoreA: number; scoreB: number; remarks?: string },
  ) {
    const match = await this.getById(matchId);
    if (match.status === 'COMPLETED') throw ApiError.badRequest('Match is already completed');

    let winnerId: string | null = null;
    if (input.result === 'PLAYER_A_WIN' || input.result === 'WALKOVER_A') winnerId = match.playerAId;
    if (input.result === 'PLAYER_B_WIN' || input.result === 'WALKOVER_B') winnerId = match.playerBId;

    const durationSecs = match.startedAt
      ? Math.round((Date.now() - match.startedAt.getTime()) / 1000)
      : null;

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED' as MatchStatus,
        result: input.result,
        scoreA: input.scoreA,
        scoreB: input.scoreB,
        winnerId,
        remarks: input.remarks,
        finishedAt: new Date(),
        durationSecs,
      },
    });

    const ops = [];
    if (match.playerAId) {
      ops.push(
        prisma.result.create({
          data: {
            matchId,
            tournamentId: match.tournamentId,
            playerId: match.playerAId,
            points: input.scoreA,
            finalResult: input.result,
          },
        }),
      );
    }
    if (match.playerBId) {
      ops.push(
        prisma.result.create({
          data: {
            matchId,
            tournamentId: match.tournamentId,
            playerId: match.playerBId,
            points: input.scoreB,
            finalResult: input.result,
          },
        }),
      );
    }

    if (winnerId) {
      const loserId = winnerId === match.playerAId ? match.playerBId : match.playerAId;
      ops.push(prisma.player.update({ where: { id: winnerId }, data: { wins: { increment: 1 } } }));
      if (loserId) {
        ops.push(prisma.player.update({ where: { id: loserId }, data: { losses: { increment: 1 } } }));
      }
    } else if (input.result === 'DRAW') {
      if (match.playerAId) {
        ops.push(prisma.player.update({ where: { id: match.playerAId }, data: { draws: { increment: 1 } } }));
      }
      if (match.playerBId) {
        ops.push(prisma.player.update({ where: { id: match.playerBId }, data: { draws: { increment: 1 } } }));
      }
    }

    await prisma.$transaction(ops);

    const remaining = await prisma.match.count({
      where: { roundId: match.roundId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    });
    if (remaining === 0) {
      await prisma.round.update({ where: { id: match.roundId }, data: { status: 'COMPLETED', completedAt: new Date() } });
    }

    return updated;
  },

  async getById(id: string) {
    const match = await prisma.match.findUnique({
      where: { id },
      include: { playerA: true, playerB: true, round: true, tournament: true },
    });
    if (!match) throw ApiError.notFound('Match not found');
    return match;
  },

  async listByTournament(tournamentId: string, roundNumber?: number) {
    return prisma.match.findMany({
      where: {
        tournamentId,
        ...(roundNumber ? { round: { roundNumber } } : {}),
      },
      include: {
        playerA: { select: { id: true, name: true, photoUrl: true, fideRating: true } },
        playerB: { select: { id: true, name: true, photoUrl: true, fideRating: true } },
        round: { select: { roundNumber: true, status: true } },
      },
      orderBy: [{ round: { roundNumber: 'asc' } }, { boardNumber: 'asc' }],
    });
  },

  async listRounds(tournamentId: string) {
    return prisma.round.findMany({
      where: { tournamentId },
      orderBy: { roundNumber: 'asc' },
      include: { _count: { select: { matches: true } } },
    });
  },
};
