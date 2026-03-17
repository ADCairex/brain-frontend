import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/** @param {{ children: import('react').ReactNode }} props */
export default function Layout({ children }) {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <>
      {children}
      <AnimatePresence>
        {!isHome && (
          <motion.div
            key="back-home"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-6 z-50"
          >
            <Link
              to="/"
              aria-label="Volver al inicio"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-900/10 dark:shadow-slate-900/40 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              Inicio
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
