import { useQuery } from "@tanstack/react-query";
import { api } from "../services/apiClient";
import type { ApiEnvelope, Player, Tournament } from "../types";

export interface DashboardStats {
  totalPlayers: number;
  totalTournaments: number;
  activeTournaments: number;
  completedTournaments: number;
  upcomingTournaments: number;
}

async function fetchDashboardStats(): Promise<{
  stats: DashboardStats;
  recentPlayers: Player[];
  recentTournaments: Tournament[];
}> {
  const [playersRes, tournamentsRes] = await Promise.all([
    api.get<ApiEnvelope<Player[]>>("/players", { params: { page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" } }),
    api.get<ApiEnvelope<Tournament[]>>("/tournaments", { params: { page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" } }),
  ]);

  const tournaments = tournamentsRes.data.data ?? [];

  return {
    stats: {
      totalPlayers: playersRes.data.pagination?.total ?? 0,
      totalTournaments: tournamentsRes.data.pagination?.total ?? 0,
      activeTournaments: tournaments.filter((t) => t.status === "LIVE").length,
      completedTournaments: tournaments.filter((t) => t.status === "COMPLETED").length,
      upcomingTournaments: tournaments.filter((t) => t.status === "UPCOMING").length,
    },
    recentPlayers: playersRes.data.data ?? [],
    recentTournaments: tournaments,
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    retry: 1,
  });
}
