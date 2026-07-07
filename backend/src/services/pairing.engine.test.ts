import {
  generateRoundRobinSchedule,
  generateKnockoutBracket,
  generateSwissRound,
  PairablePlayer,
  SwissStanding,
} from './pairing.engine';

function makePlayers(count: number): PairablePlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `P${i + 1}`,
    rating: 2000 - i * 50,
  }));
}

describe('generateRoundRobinSchedule', () => {
  it('produces n-1 rounds for an even number of players', () => {
    const players = makePlayers(6);
    const schedule = generateRoundRobinSchedule(players);
    expect(schedule).toHaveLength(5);
  });

  it('produces n rounds (with a bye each round) for an odd number of players', () => {
    const players = makePlayers(5);
    const schedule = generateRoundRobinSchedule(players);
    expect(schedule).toHaveLength(5);
    const totalByes = schedule.flat().filter((p) => p.isBye).length;
    expect(totalByes).toBe(5); // exactly one bye per round
  });

  it('never pairs the same two players twice across the whole schedule', () => {
    const players = makePlayers(8);
    const schedule = generateRoundRobinSchedule(players);
    const seen = new Set<string>();

    for (const round of schedule) {
      for (const pairing of round) {
        if (pairing.isBye) continue;
        const key = [pairing.playerAId, pairing.playerBId].sort().join('-');
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }

    // Total unique pairings for n players = n*(n-1)/2
    expect(seen.size).toBe((8 * 7) / 2);
  });

  it('never has a player appear twice within the same round', () => {
    const players = makePlayers(7);
    const schedule = generateRoundRobinSchedule(players);

    for (const round of schedule) {
      const appearances = new Set<string>();
      for (const pairing of round) {
        for (const id of [pairing.playerAId, pairing.playerBId]) {
          if (!id) continue;
          expect(appearances.has(id)).toBe(false);
          appearances.add(id);
        }
      }
    }
  });

  it('every player plays every other player exactly once', () => {
    const players = makePlayers(6);
    const schedule = generateRoundRobinSchedule(players);
    const matchCounts = new Map<string, number>();

    for (const round of schedule) {
      for (const pairing of round) {
        if (pairing.isBye) continue;
        [pairing.playerAId, pairing.playerBId].forEach((id) => {
          if (id) matchCounts.set(id, (matchCounts.get(id) ?? 0) + 1);
        });
      }
    }

    for (const player of players) {
      expect(matchCounts.get(player.id)).toBe(players.length - 1);
    }
  });
});

describe('generateKnockoutBracket', () => {
  it('pairs all players with no byes when count is already a power of 2', () => {
    const players = makePlayers(8);
    const bracket = generateKnockoutBracket(players);
    expect(bracket).toHaveLength(4);
    expect(bracket.every((p) => !p.isBye)).toBe(true);
  });

  it('pads to the next power of 2 and gives byes to the top seeds', () => {
    const players = makePlayers(5); // pads to 8 -> 3 byes
    const bracket = generateKnockoutBracket(players);
    expect(bracket).toHaveLength(4);

    const byeMatches = bracket.filter((p) => p.isBye);
    expect(byeMatches).toHaveLength(3);

    // The top 3 rated players (P1, P2, P3) should be the ones with byes
    const byePlayerIds = byeMatches.map((m) => m.playerAId).sort();
    expect(byePlayerIds).toEqual(['P1', 'P2', 'P3'].sort());
  });

  it('includes every player exactly once across the bracket', () => {
    const players = makePlayers(6);
    const bracket = generateKnockoutBracket(players);
    const allIds = bracket.flatMap((p) => [p.playerAId, p.playerBId]).filter(Boolean);
    expect(new Set(allIds).size).toBe(players.length);
  });
});

describe('generateSwissRound', () => {
  function standing(id: string, rating: number, points = 0, opponentsFaced: string[] = []): SwissStanding {
    return { playerId: id, rating, points, opponentsFaced };
  }

  it('pairs players with equal points against each other when possible', () => {
    const standings = [
      standing('A', 2000, 1),
      standing('B', 1900, 1),
      standing('C', 1800, 0),
      standing('D', 1700, 0),
    ];
    const pairings = generateSwissRound(standings);
    expect(pairings).toHaveLength(2);
    expect(pairings.some((p) => p.playerAId === 'A' && p.playerBId === 'B')).toBe(true);
    expect(pairings.some((p) => p.playerAId === 'C' && p.playerBId === 'D')).toBe(true);
  });

  it('avoids rematching players who have already faced each other', () => {
    const standings = [
      standing('A', 2000, 1, ['B']),
      standing('B', 1900, 1, ['A']),
      standing('C', 1800, 1, []),
      standing('D', 1700, 0, []),
    ];
    const pairings = generateSwissRound(standings);
    // A and B have already played - they should not be repaired if an alternative exists
    const aVsB = pairings.find(
      (p) =>
        (p.playerAId === 'A' && p.playerBId === 'B') || (p.playerAId === 'B' && p.playerBId === 'A'),
    );
    expect(aVsB).toBeUndefined();
  });

  it('gives a bye to exactly one player when the count is odd', () => {
    const standings = [standing('A', 2000), standing('B', 1900), standing('C', 1800)];
    const pairings = generateSwissRound(standings);
    const byes = pairings.filter((p) => p.isBye);
    expect(byes).toHaveLength(1);
  });

  it('never pairs a player against themselves and never duplicates a player within a round', () => {
    const standings = Array.from({ length: 10 }, (_, i) => standing(`P${i}`, 2000 - i * 10));
    const pairings = generateSwissRound(standings);
    const seen = new Set<string>();
    for (const p of pairings) {
      if (p.playerAId) {
        expect(seen.has(p.playerAId)).toBe(false);
        seen.add(p.playerAId);
      }
      if (p.playerBId) {
        expect(p.playerBId).not.toBe(p.playerAId);
        expect(seen.has(p.playerBId)).toBe(false);
        seen.add(p.playerBId);
      }
    }
  });
});
