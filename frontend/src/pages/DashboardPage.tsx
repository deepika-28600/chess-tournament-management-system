import { motion } from 'framer-motion';
import {
  FiUsers,
  FiAward,
  FiActivity,
  FiCheckCircle,
  FiCalendar,
  FiTrendingUp,
  FiPlusCircle,
  FiUserPlus,
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import { useDashboardStats } from '../hooks/useDashboardStats';
import StatCard from '../components/StatCard';
import DashboardSkeleton from '../components/DashboardSkeleton';

const growthData = [
  { month: 'Jan', players: 32 },
  { month: 'Feb', players: 48 },
  { month: 'Mar', players: 61 },
  { month: 'Apr', players: 75 },
  { month: 'May', players: 98 },
  { month: 'Jun', players: 130 },
  { month: 'Jul', players: 162 },
];

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboardStats();

  const statusBreakdown = data
    ? [
        { name: 'Live', value: data.stats.activeTournaments },
        { name: 'Completed', value: data.stats.completedTournaments },
        { name: 'Upcoming', value: data.stats.upcomingTournaments },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Overview of players, tournaments, and live activity
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/players" className="btn-secondary text-sm">
            <FiUserPlus /> Add Player
          </Link>
          <Link to="/tournaments" className="btn-primary text-sm">
            <FiPlusCircle /> New Tournament
          </Link>
        </div>
      </motion.div>

      {isLoading && <DashboardSkeleton />}

      {isError && (
        <div className="glass-card p-6 text-center text-sm text-red-500">
          Couldn't load dashboard data. Make sure the backend API is running and reachable.
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Players"
              value={data.stats.totalPlayers}
              icon={FiUsers}
              accent="bg-brand-600"
              delay={0}
            />
            <StatCard
              label="Total Tournaments"
              value={data.stats.totalTournaments}
              icon={FiAward}
              accent="bg-violet-600"
              delay={0.05}
            />
            <StatCard
              label="Active Tournaments"
              value={data.stats.activeTournaments}
              icon={FiActivity}
              accent="bg-emerald-600"
              delay={0.1}
            />
            <StatCard
              label="Completed Tournaments"
              value={data.stats.completedTournaments}
              icon={FiCheckCircle}
              accent="bg-amber-600"
              delay={0.15}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-5 lg:col-span-2"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Player Growth</h2>
                <FiTrendingUp className="text-brand-500" />
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorPlayers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                  />
                  <Area type="monotone" dataKey="players" stroke="#6366f1" fill="url(#colorPlayers)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-card p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Tournament Status</h2>
                <FiCalendar className="text-brand-500" />
              </div>
              {statusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {statusBreakdown.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                  No tournaments yet — create your first one to see stats here.
                </div>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <h2 className="mb-4 font-semibold">Recent Registrations</h2>
            {data.recentPlayers.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No players registered yet.{' '}
                <Link to="/players" className="font-medium text-brand-600">
                  Add your first player
                </Link>
                .
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Country</th>
                      <th className="pb-2 font-medium">Rating</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentPlayers.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                        <td className="py-2.5 font-medium">{p.name}</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">{p.country}</td>
                        <td className="py-2.5">{p.fideRating}</td>
                        <td className="py-2.5">
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
