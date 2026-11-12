import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';

const ITEMS = [
  { to: '/', label: 'Belajar', icon: '🗺️', end: true },
  { to: '/lab', label: 'Lab', icon: '🧪' },
  { to: '/pengaturan', label: 'Profil', icon: '⚙️' },
];

/** Navigasi bawah (HP) / samping atas (desktop). Disembunyikan saat tes berlangsung. */
export default function BottomNav() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 backdrop-blur md:static md:border-0 md:bg-transparent"
    >
      <ul className="mx-auto flex max-w-md justify-around md:max-w-none md:justify-start md:gap-2">
        {ITEMS.map((it) => (
          <li key={it.to}>
            <NavLink to={it.to} end={it.end} className="relative flex min-h-14 min-w-20 flex-col items-center justify-center px-3 text-xs font-bold md:min-h-10 md:flex-row md:gap-1.5 md:text-sm">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span layoutId="nav-pill" className="absolute inset-1 rounded-xl bg-violet-100" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                  <span className="relative text-xl md:text-base" aria-hidden>
                    {it.icon}
                  </span>
                  <span className={`relative ${isActive ? 'text-violet-800' : 'text-ink/60'}`}>{it.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
