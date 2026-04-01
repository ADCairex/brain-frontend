import { useNavigate } from "react-router-dom";
import {
  Wallet,
  BookOpen,
  CheckSquare,
  ArrowRight,
  Sparkles,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

const modules = [
  {
    id: "finance",
    name: "Módulo de Finanzas",
    description: "Gastos, ingresos e inversiones",
    icon: Wallet,
    path: "/finance",
    gradient: "from-emerald-400 to-emerald-600",
    glow: "shadow-emerald-500/25",
    ring: "ring-emerald-500/20",
    active: true,
  },
  {
    id: "calendar",
    name: "Calendario",
    description: "Eventos y agenda personal",
    icon: Calendar,
    path: "/calendar",
    gradient: "from-sky-400 to-sky-600",
    glow: "shadow-sky-500/25",
    ring: "ring-sky-500/20",
    active: true,
  },
  {
    id: "notes",
    name: "Notas",
    description: "Próximamente",
    icon: BookOpen,
    path: null,
    gradient: "from-violet-400 to-violet-600",
    glow: "shadow-violet-500/20",
    ring: "ring-violet-500/15",
    active: false,
  },
  {
    id: "tasks",
    name: "Tareas",
    description: "Próximamente",
    icon: CheckSquare,
    path: null,
    gradient: "from-blue-400 to-blue-600",
    glow: "shadow-blue-500/20",
    ring: "ring-blue-500/15",
    active: false,
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="px-6 pt-12 pb-2 max-w-2xl mx-auto w-full"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
            Brain
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
          ¿A dónde vamos hoy?
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Selecciona un módulo para continuar
        </p>
      </motion.header>

      {/* Module grid */}
      <main className="flex-1 px-6 pt-8 pb-12 max-w-2xl mx-auto w-full">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4"
        >
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <motion.div key={mod.id} variants={item}>
                <button
                  onClick={() => mod.active && navigate(mod.path)}
                  disabled={!mod.active}
                  aria-label={
                    mod.active
                      ? `Ir a ${mod.name}`
                      : `${mod.name} — próximamente`
                  }
                  className={[
                    "w-full text-left rounded-2xl p-5 border transition-all duration-200 group",
                    "ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                    mod.active
                      ? [
                          "bg-white dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/60",
                          "hover:border-slate-300 dark:hover:border-slate-600",
                          "hover:shadow-lg dark:hover:shadow-2xl",
                          mod.glow,
                          mod.ring,
                          "cursor-pointer",
                        ].join(" ")
                      : [
                          "bg-white/50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-700/30",
                          "opacity-50 cursor-not-allowed",
                          mod.ring,
                        ].join(" "),
                  ].join(" ")}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={[
                        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-md",
                        mod.gradient,
                        mod.active ? mod.glow : "",
                      ].join(" ")}
                    >
                      <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-base leading-tight">
                        {mod.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {mod.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    {mod.active && (
                      <ArrowRight
                        className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
