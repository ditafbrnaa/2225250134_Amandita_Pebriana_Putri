import { motion } from 'motion/react';

/** Logo VennBuster: dua lingkaran pastel beririsan dengan irisan menyala. */
export default function Logo({ className = 'h-10 w-10', animated = false }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Logo VennBuster">
      <defs>
        <linearGradient id="vb-logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFC2D6" />
          <stop offset="1" stopColor="#C9A9FF" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="19" fill="url(#vb-logo-bg)" stroke="#EB93B9" strokeWidth="3" />
      <motion.circle
        cx="25"
        cy="32"
        r="14"
        fill="#9CC9FF"
        stroke="#EB93B9"
        strokeWidth="2.5"
        initial={animated ? { cx: 32 } : false}
        animate={{ cx: 25 }}
        transition={{ type: 'spring', stiffness: 120, damping: 10, delay: 0.1 }}
      />
      <motion.circle
        cx="39"
        cy="32"
        r="14"
        fill="#FFC39B"
        fillOpacity="0.92"
        stroke="#EB93B9"
        strokeWidth="2.5"
        initial={animated ? { cx: 32 } : false}
        animate={{ cx: 39 }}
        transition={{ type: 'spring', stiffness: 120, damping: 10, delay: 0.1 }}
      />
      <motion.path
        d="M32 19.88 A14 14 0 0 1 32 44.12 A14 14 0 0 1 32 19.88 Z"
        fill="#FFD84D"
        stroke="#EB93B9"
        strokeWidth="2.5"
        initial={animated ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />
      {/* kilau kecil */}
      <path d="M50 9c.4 2.6 1.1 3.3 3.7 3.7-2.6.4-3.3 1.1-3.7 3.7-.4-2.6-1.1-3.3-3.7-3.7 2.6-.4 3.3-1.1 3.7-3.7z" fill="#fff" />
    </svg>
  );
}
