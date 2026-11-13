import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { playClick } from '@/utils/sound.js';

const CLICKABLE = 'button, a[href], [role="button"], summary, input[type="checkbox"], input[type="radio"], select';
const COLORS = ['#FF9CC6', '#A9D4FF', '#FFC2D6', '#9CC9FF', '#FFD84D', '#B8DCFF'];
const PARTICLES = 7;

/**
 * Efek klik global: bunyi "pop" + percikan kecil pink-biru yang hilang dalam ±0,45 detik.
 * Percikan dimatikan di mode ujian dan saat "Kurangi animasi" aktif.
 * @param {{ sparkle?: boolean }} props
 */
export default function ClickFx({ sparkle = true }) {
  const [bursts, setBursts] = useState([]);
  const prefersReduced = useReducedMotion();
  const showSparkle = sparkle && !prefersReduced;

  useEffect(() => {
    let nextId = 0;
    const onClick = (e) => {
      const el = e.target instanceof Element ? e.target.closest(CLICKABLE) : null;
      if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
      const small = el.matches('input[type="checkbox"], input[type="radio"]');
      playClick(small ? 'soft' : 'pop');
      if (!showSparkle) return;
      // Klik keyboard (Enter/Spasi) tidak punya koordinat → pakai tengah elemen.
      let { clientX: x, clientY: y } = e;
      if (e.detail === 0) {
        const r = el.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      const id = ++nextId;
      setBursts((b) => [...b.slice(-4), { id, x, y }]);
      setTimeout(() => setBursts((b) => b.filter((it) => it.id !== id)), 500);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [showSparkle]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
      <AnimatePresence>
        {bursts.map((b) =>
          Array.from({ length: PARTICLES }, (_, i) => {
            const angle = (i / PARTICLES) * Math.PI * 2 + b.id;
            const dist = 22 + (i % 3) * 7;
            const star = i % 2 === 0;
            return (
              <motion.span
                key={`${b.id}-${i}`}
                className="absolute block"
                style={{ left: b.x - 5, top: b.y - 5, width: 10, height: 10 }}
                initial={{ x: 0, y: 0, scale: 0.4, opacity: 1, rotate: 0 }}
                animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: 1, opacity: 0, rotate: star ? 90 : 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                {star ? (
                  <svg viewBox="0 0 24 24" width="10" height="10">
                    <path d="M12 0c.9 6.4 2.6 8.1 9 9-6.4.9-8.1 2.6-9 9-.9-6.4-2.6-8.1-9-9 6.4-.9 8.1-2.6 9-9z" fill={COLORS[i % COLORS.length]} />
                  </svg>
                ) : (
                  <span className="block h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                )}
              </motion.span>
            );
          }),
        )}
      </AnimatePresence>
    </div>
  );
}
