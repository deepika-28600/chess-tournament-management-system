import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiPlus, FiX, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/apiClient';
import type { ApiEnvelope, Player } from '../types';

const playerFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  age: z.number().int().min(4).max(120),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  country: z.string().min(2, 'Country is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  fideRating: z.number().int().min(0).max(3500).optional(),
});
type PlayerFormValues = z.infer<typeof playerFormSchema>;

async function fetchPlayers(page: number, search: string) {
  const { data } = await api.get<ApiEnvelope<Player[]>>('/players', {
    params: { page, limit: 10, search: search || undefined },
  });
  return { items: data.data ?? [], pagination: data.pagination };
}

export default function PlayersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['players', page, search],
    queryFn: () => fetchPlayers(page, search),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlayerFormValues>({ resolver: zodResolver(playerFormSchema) });

  const createMutation = useMutation({
    mutationFn: (values: PlayerFormValues) => api.post('/players', values),
    onSuccess: () => {
      toast.success('Player created successfully');
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setModalOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create player';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/players/${id}`),
    onSuccess: () => {
      toast.success('Player moved to recycle bin');
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
    onError: () => toast.error('Failed to delete player'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Players</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {data?.pagination?.total ?? 0} registered players
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm">
          <FiPlus /> Add Player
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="relative max-w-sm">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, or player code..."
            className="input-field pl-10"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          {isLoading ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-12 w-full" />
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="pb-2 font-medium">Code</th>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Country</th>
                  <th className="pb-2 font-medium">Rating</th>
                  <th className="pb-2 font-medium">W/L/D</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800/60"
                  >
                    <td className="py-2.5 font-mono text-xs text-slate-400">{p.playerCode}</td>
                    <td className="py-2.5 font-medium">{p.name}</td>
                    <td className="py-2.5 text-slate-500 dark:text-slate-400">{p.country}</td>
                    <td className="py-2.5">{p.fideRating}</td>
                    <td className="py-2.5 text-xs">
                      {p.wins}/{p.losses}/{p.draws}
                    </td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(p.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-sm text-slate-400">
              No players found. Add your first player to get started.
            </div>
          )}
        </div>

        {data && data.pagination && data.pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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
                <h2 className="text-lg font-semibold">Add New Player</h2>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <FiX size={20} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit((values) => createMutation.mutate(values))}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Full Name</label>
                  <input className="input-field" {...register('name')} />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Age</label>
                  <input type="number" className="input-field" {...register('age', { valueAsNumber: true })} />
                  {errors.age && <p className="mt-1 text-xs text-red-500">{errors.age.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Gender</label>
                  <select className="input-field" {...register('gender')}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Country</label>
                  <input className="input-field" {...register('country')} />
                  {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">FIDE Rating</label>
                  <input type="number" className="input-field" {...register('fideRating', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input type="email" className="input-field" {...register('email')} />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Phone</label>
                  <input className="input-field" {...register('phone')} />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                </div>

                <div className="mt-2 flex gap-3 sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                    {isSubmitting ? 'Saving...' : 'Save Player'}
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
