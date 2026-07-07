import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiAward } from 'react-icons/fi';
import { api } from '../services/apiClient';
import type { ApiEnvelope, Player } from '../types';

async function fetchTopPlayers() {
  const { data } = await api.get<ApiEnvelope<Player[]>>('/players', {
    params: { page: 1, limit: 20, sortBy: 'fideRating', sortOrder: 'desc' },
  });
  return data.data ?? [];
}

const medalColors = ['text-amber-400', 'text-slate-400', 'text-amber-700'];

export default function LeaderboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['leaderboard'], queryFn: fetchTopPlayers });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Top players ranked by FIDE rating</p>
      </div>

      <div className="glass-card p-5">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((p, index) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <div className="flex items-center gap-4">
                  <div className="flex w-8 justify-center">
                    {index < 3 ? (
                      <FiAward className={medalColors[index]} size={20} />
                    ) : (
                      <span className="text-sm font-semibold text-slate-400">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{p.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-600 dark:text-brand-400">{p.fideRating}</p>
                  <p className="text-xs text-slate-400">
                    {p.wins}W {p.losses}L {p.draws}D
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-slate-400">
            No players yet — the leaderboard will populate as players are added.
          </div>
        )}
      </div>
    </div>
  );
}
