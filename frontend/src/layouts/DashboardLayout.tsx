import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiUsers,
  FiAward,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiChevronDown,
} from 'react-icons/fi';
import { GiChessKing } from 'react-icons/gi';
import { useAuth } from '../store/useAuth';
import { useTheme } from '../store/useTheme';

const navItems = [
  { to: '/', label: 'Dashboard', icon: FiHome, end: true },
  { to: '/players', label: 'Players', icon: FiUsers },
  { to: '/tournaments', label: 'Tournaments', icon: FiAward },
  { to: '/leaderboard', label: 'Leaderboard', icon: FiBarChart2 },
  { to: '/settings', label: 'Settings', icon: FiSettings },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
          <GiChessKing size={18} />
        </div>
        <span className="text-lg font-bold tracking-tight">ChessHub</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          <FiLogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 lg:block">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl dark:bg-slate-900 lg:hidden"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FiX size={18} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <FiMenu size={20} />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
                </motion.span>
              </AnimatePresence>
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((p) => !p)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase() ?? 'A'}
                </div>
                <span className="hidden text-sm font-medium sm:block">{user?.name}</span>
                <FiChevronDown size={14} className="hidden text-slate-400 sm:block" />
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="glass-card absolute right-0 mt-2 w-52 overflow-hidden p-1.5"
                  >
                    <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                    </div>
                    <NavLink
                      to="/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Profile Settings
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
