import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { tapSpring } from '@/features/venn/lib/motion.js';

const ITEMS = [
  { to: '/', label: 'Belajar', icon: '🗺️', end: true },
  { to: '/lab', label: 'Lab', icon: '🧪' },
  { to: '/tutor', label: 'Tutor', icon: '🤖' },
  { to: '/pengaturan', label: 'Profil', icon: '⚙️' },
];

/** Navigasi bawah (HP) / samping atas (desktop). Disembunyikan saat tes berlangsung. */
export default function BottomNav() {
  return (
    <nav aria-label="Navigasi utama" className="safe-bottom fixed inset-x-3 bottom-2 z-30 md:static md:inset-auto">
      <ul className="mx-auto flex max-w-md justify-around rounded-3xl bg-white p-1 cartoon md:mx-0 md:inline-flex md:max-w-none md:justify-start md:gap-1">
        {ITEMS.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              end={it.end}
              className="relative block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {({ isActive }) => (
                <motion.span
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  transition={tapSpring}
                  className="relative flex min-h-14 min-w-20 flex-col items-center justify-center px-3 text-xs font-bold md:min-h-10 md:flex-row md:gap-1.5 md:text-sm"
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0.5 rounded-2xl border-2 border-line bg-linear-to-br from-blush to-babyblue"
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    />
                  )}
                  <motion.span
                    className="relative text-xl md:text-base"
                    aria-hidden
                    animate={isActive ? { scale: [1, 1.25, 1], rotate: [0, -10, 0] } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {it.icon}
                  </motion.span>
                  <span className={`relative ${isActive ? 'text-ink' : 'text-ink/70'}`}>{it.label}</span>
                  {isActive && (
                    <motion.span
                      aria-hidden
                      className="absolute -top-1 right-2 text-[10px] text-brand-blue"
                      initial={{ scale: 0, rotate: -90, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.15 }}
                    >
                      ✦
                    </motion.span>
                  )}
                </motion.span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
