export type UserRole = "SUPER_ADMIN" | "ADMIN" | "ORGANIZER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export type PlayerStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface Player {
  id: string;
  playerCode: string;
  photoUrl: string | null;
  name: string;
  age: number;
  gender: Gender;
  country: string;
  state: string | null;
  city: string | null;
  email: string;
  phone: string;
  fideRating: number;
  experienceYears: number;
  wins: number;
  losses: number;
  draws: number;
  currentRank: number | null;
  status: PlayerStatus;
  createdAt: string;
}

export type TournamentType =
  | "KNOCKOUT" | "LEAGUE" | "ROUND_ROBIN" | "SWISS" | "RAPID" | "BLITZ" | "CLASSICAL";

export type TournamentStatus = "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED";

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string;
  startDate: string;
  endDate: string;
  maxPlayers: number;
  entryFee: string;
  prizePool: string;
  type: TournamentType;
  bannerUrl: string | null;
  status: TournamentStatus;
  totalRounds: number;
  _count?: { registrations: number; matches: number; rounds?: number };
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}
