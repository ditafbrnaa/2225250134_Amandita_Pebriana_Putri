import { motion } from 'motion/react';

/** Logo VennBuster: dua lingkaran beririsan dengan irisan menyala. */
export default function Logo({ className = 'h-10 w-10', animated = false }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Logo VennBuster">
      <rect width="64" height="64" rx="16" fill="#4C1D95" />
      <motion.circle
        cx="25"
        cy="32"
        r="14"
        fill="#3B82F6"
        fillOpacity="0.9"
        initial={animated ? { cx: 32 } : false}
        animate={{ cx: 25 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.1 }}
      />
      <motion.circle
        cx="39"
        cy="32"
        r="14"
        fill="#F59E0B"
        fillOpacity="0.9"
        initial={animated ? { cx: 32 } : false}
        animate={{ cx: 39 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.1 }}
      />
      <motion.path
        d="M32 19.88 A14 14 0 0 1 32 44.12 A14 14 0 0 1 32 19.88 Z"
        fill="#FACC15"
        initial={animated ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />
    </svg>
  );
}
