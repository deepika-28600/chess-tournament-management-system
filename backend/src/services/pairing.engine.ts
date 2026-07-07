/**
 * Pairing engine for chess tournament round generation.
 * Pure functions -- no DB access -- so they're easy to unit test in isolation.
 */

export interface PairablePlayer {
  id: string;
  rating: number;
}

export interface Pairing {
  playerAId: string | null;
  playerBId: string | null;
  isBye: boolean;
}

export function generateRoundRobinSchedule(players: PairablePlayer[]): Pairing[][] {
  const ids = players.map((p) => p.id);
  const hasBye = ids.length % 2 !== 0;
  if (hasBye) ids.push('__BYE__');

  const n = ids.length;
  const rounds = n - 1;
  const schedule: Pairing[][] = [];

  const arr = [...ids];

  for (let round = 0; round < rounds; round++) {
    const roundPairings: Pairing[] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a === '__BYE__' || b === '__BYE__') {
        const real = a === '__BYE__' ? b : a;
        roundPairings.push({ playerAId: real, playerBId: null, isBye: true });
      } else {
        roundPairings.push({ playerAId: a, playerBId: b, isBye: false });
      }
    }
    schedule.push(roundPairings);

    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop() as string);
    arr.splice(0, arr.length, fixed, ...rest);
  }

  return schedule;
}

export function generateKnockoutBracket(players: PairablePlayer[]): Pairing[] {
  const sorted = [...players].sort((a, b) => b.rating - a.rating);
  const size = Math.pow(2, Math.ceil(Math.log2(Math.max(sorted.length, 1))));
  const byesNeeded = size - sorted.length;

  const seeded: (PairablePlayer | null)[] = [...sorted];
  for (let i = 0; i < byesNeeded; i++) {
    seeded.splice(i * 2 + 1, 0, null);
  }

  const pairings: Pairing[] = [];
  for (let i = 0; i < seeded.length; i += 2) {
    const a = seeded[i];
    const b = seeded[i + 1];
    if (!a && !b) continue;
    if (!a || !b) {
      const real = a ?? b;
      pairings.push({ playerAId: real!.id, playerBId: null, isBye: true });
    } else {
      pairings.push({ playerAId: a.id, playerBId: b.id, isBye: false });
    }
  }

  return pairings;
}

export interface SwissStanding {
  playerId: string;
  rating: number;
  points: number;
  opponentsFaced: string[];
}

export function generateSwissRound(standings: SwissStanding[]): Pairing[] {
  const pool = [...standings].sort((a, b) => b.points - a.points || b.rating - a.rating);
  const pairings: Pairing[] = [];
  const used = new Set<string>();

  for (let i = 0; i < pool.length; i++) {
    const player = pool[i];
    if (used.has(player.playerId)) continue;

    let opponentIndex = -1;
    for (let j = i + 1; j < pool.length; j++) {
      const candidate = pool[j];
      if (used.has(candidate.playerId)) continue;
      if (!player.opponentsFaced.includes(candidate.playerId)) {
        opponentIndex = j;
        break;
      }
    }

    if (opponentIndex === -1) {
      for (let j = i + 1; j < pool.length; j++) {
        if (!used.has(pool[j].playerId)) {
          opponentIndex = j;
          break;
        }
      }
    }

    if (opponentIndex === -1) {
      pairings.push({ playerAId: player.playerId, playerBId: null, isBye: true });
      used.add(player.playerId);
    } else {
      const opponent = pool[opponentIndex];
      pairings.push({ playerAId: player.playerId, playerBId: opponent.playerId, isBye: false });
      used.add(player.playerId);
      used.add(opponent.playerId);
    }
  }

  return pairings;
}
