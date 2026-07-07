import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiX, FiMapPin, FiUsers, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/apiClient';
import type { ApiEnvelope, Tournament } from '../types';

const tournamentFormSchema = z
  .object({
    name: z.string().min(3, 'Name is required'),
    location: z.string().min(2, 'Location is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    maxPlayers: z.number().int().min(2),
    type: z.enum(['KNOCKOUT', 'LEAGUE', 'ROUND_ROBIN', 'SWISS', 'RAPID', 'BLITZ', 'CLASSICAL']),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });
type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

const statusColors: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  LIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  COMPLETED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

async function fetchTournaments() {
  const { data } = await api.get<ApiEnvelope<Tournament[]>>('/tournaments', {
    params: { page: 1, limit: 20, sortBy: 'startDate', sortOrder: 'desc' },
  });
  return data.data ?? [];
}

export default function TournamentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['tournaments'], queryFn: fetchTournaments });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TournamentFormValues>({ resolver: zodResolver(tournamentFormSchema) });

  const createMutation = useMutation({
    mutationFn: (values: TournamentFormValues) => api.post('/tournaments', values),
    onSuccess: () => {
      toast.success('Tournament created successfully');
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setModalOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create tournament';
      toast.error(message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage and organize chess tournaments</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm">
          <FiPlus /> New Tournament
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-40" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              className="glass-card p-5"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="font-semibold leading-snug">{t.name}</h3>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[t.status]}`}>
                  {t.status}
                </span>
              </div>
              <div className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                <p className="flex items-center gap-1.5">
                  <FiMapPin size={13} /> {t.location}
                </p>
                <p className="flex items-center gap-1.5">
                  <FiCalendar size={13} /> {new Date(t.startDate).toLocaleDateString()} –{' '}
                  {new Date(t.endDate).toLocaleDateString()}
                </p>
                <p className="flex items-center gap-1.5">
                  <FiUsers size={13} /> {t._count?.registrations ?? 0} / {t.maxPlayers} players
                </p>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3 text-xs font-medium uppercase tracking-wide text-brand-600 dark:border-slate-800 dark:text-brand-400">
                {t.type.replace('_', ' ')}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card py-16 text-center text-sm text-slate-400">
          No tournaments yet. Create your first tournament to get started.
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card w-full max-w-lg bg-white p-6 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Tournament</h2>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <FiX size={20} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit((values) => createMutation.mutate(values))}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Tournament Name</label>
                  <input className="input-field" {...register('name')} />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Location</label>
                  <input className="input-field" {...register('location')} />
                  {errors.location && <p className="mt-1 text-xs text-red-500">{errors.location.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Start Date</label>
                  <input type="date" className="input-field" {...register('startDate')} />
                  {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">End Date</label>
                  <input type="date" className="input-field" {...register('endDate')} />
                  {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Max Players</label>
                  <input type="number" className="input-field" {...register('maxPlayers', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Format</label>
                  <select className="input-field" {...register('type')}>
                    <option value="SWISS">Swiss</option>
                    <option value="KNOCKOUT">Knockout</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                    <option value="LEAGUE">League</option>
                    <option value="RAPID">Rapid</option>
                    <option value="BLITZ">Blitz</option>
                    <option value="CLASSICAL">Classical</option>
                  </select>
                </div>

                <div className="mt-2 flex gap-3 sm:col-span-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                    {isSubmitting ? 'Creating...' : 'Create Tournament'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
