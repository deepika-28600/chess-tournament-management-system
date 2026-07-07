import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import { GiChessKing } from 'react-icons/gi';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 12 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow"
      >
        <GiChessKing size={36} />
      </motion.div>
      <h1 className="text-6xl font-bold tracking-tight text-slate-900 dark:text-white">404</h1>
      <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
        This square is empty — the page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn-primary mt-6">
        <FiArrowLeft /> Back to Dashboard
      </Link>
    </div>
  );
}
