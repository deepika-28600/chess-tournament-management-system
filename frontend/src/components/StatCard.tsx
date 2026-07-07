import { motion } from "framer-motion";
import type { IconType } from "react-icons";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: IconType;
  accent: string;
  delay?: number;
  trend?: { value: string; positive: boolean };
}

export default function StatCard({ label, value, icon: Icon, accent, delay = 0, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -3 }}
      className="glass-card group relative overflow-hidden p-5"
    >
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-125 ${accent}`}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <span
              className={`mt-2 inline-block text-xs font-semibold ${
                trend.positive ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {trend.positive ? "▲" : "▼"} {trend.value}
            </span>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-glow ${accent}`}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}
