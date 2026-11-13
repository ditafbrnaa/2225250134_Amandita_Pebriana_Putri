import { motion } from 'motion/react';

// Posisi tetap (bukan acak) agar tampilan stabil antar-render dan mudah diuji.
const ITEMS = [
  { kind: 'bubble', top: '8%', left: '6%', size: 46, color: '#FFC2D6', dur: 14 },
  { kind: 'star', top: '14%', left: '88%', size: 18, color: '#FFD84D', dur: 11 },
  { kind: 'sparkle', top: '32%', left: '3%', size: 16, color: '#C9A9FF', dur: 9 },
  { kind: 'bubble', top: '46%', left: '93%', size: 34, color: '#BFEAD6', dur: 16 },
  { kind: 'star', top: '64%', left: '5%', size: 14, color: '#FFB38A', dur: 12 },
  { kind: 'sparkle', top: '78%', left: '84%', size: 20, color: '#FFC2D6', dur: 10 },
  { kind: 'bubble', top: '88%', left: '14%', size: 28, color: '#C9A9FF', dur: 15 },
  { kind: 'sparkle', top: '6%', left: '52%', size: 12, color: '#9CC9FF', dur: 13 },
  { kind: 'bubble', top: '24%', left: '74%', size: 18, color: '#9CC9FF', dur: 17 },
];

function Shape({ kind, size, color }) {
  if (kind === 'bubble') {
    return (
      <span
        className="block rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 32% 30%, #ffffffcc 0 18%, ${color} 55%, ${color}88 100%)`,
        }}
      />
    );
  }
  const d =
    kind === 'star'
      ? 'M12 2l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.1 6 20.4l1.3-6.7-5-4.7 6.8-.8z'
      : 'M12 0c.9 6.4 2.6 8.1 9 9-6.4.9-8.1 2.6-9 9-.9-6.4-2.6-8.1-9-9 6.4-.9 8.1-2.6 9-9z';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d={d} fill={color} />
    </svg>
  );
}

/**
 * Hiasan pastel di latar belakang. Tidak menangkap klik, disembunyikan dari pembaca layar,
 * dan berada di belakang konten agar tidak mengganggu keterbacaan.
 * @param {{animated?: boolean}} props  false → hiasan diam (dipakai di layar tugas).
 */
export default function CuteBackdrop({ animated = true }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {ITEMS.map((it, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: it.top, left: it.left, opacity: it.kind === 'bubble' ? 0.45 : 0.7 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={
            animated
              ? { scale: 1, opacity: it.kind === 'bubble' ? 0.45 : 0.7, y: [0, -14, 0], rotate: it.kind === 'bubble' ? 0 : [0, 18, 0] }
              : { scale: 1, opacity: it.kind === 'bubble' ? 0.35 : 0.5, y: 0, rotate: 0 }
          }
          transition={{
            scale: { type: 'spring', stiffness: 200, damping: 14, delay: 0.1 + i * 0.06 },
            opacity: { duration: 0.6, delay: 0.1 + i * 0.06 },
            y: animated ? { duration: it.dur / 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 },
            rotate: animated ? { duration: it.dur, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 },
          }}
        >
          <Shape {...it} />
        </motion.div>
      ))}
    </div>
  );
}
