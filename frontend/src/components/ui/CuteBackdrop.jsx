import { motion } from 'motion/react';
import MiniChibi from './MiniChibi.jsx';

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
  { kind: 'venn', top: '56%', left: '78%', size: 40, color: '#9CC9FF', dur: 18 },
  { kind: 'venn', top: '18%', left: '22%', size: 30, color: '#FFC2D6', dur: 20 },
  { kind: 'heart', top: '70%', left: '92%', size: 16, color: '#FFB3CF', dur: 12 },
  { kind: 'heart', top: '40%', left: '10%', size: 14, color: '#A9D4FF', dur: 14 },
  { kind: 'star', top: '92%', left: '62%', size: 16, color: '#A9D4FF', dur: 11 },
  { kind: 'bubble', top: '60%', left: '30%', size: 22, color: '#B8DCFF', dur: 19 },
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
  if (kind === 'venn') {
    // Mini diagram Venn pink-biru: hiasan yang tetap "nyambung" dengan materi.
    return (
      <svg width={size * 1.5} height={size} viewBox="0 0 36 24">
        <circle cx="13" cy="12" r="9" fill="#A9D4FF" fillOpacity="0.55" stroke="#7FB4E6" strokeWidth="1.5" />
        <circle cx="23" cy="12" r="9" fill="#FFB3CF" fillOpacity="0.55" stroke="#EB93B9" strokeWidth="1.5" />
      </svg>
    );
  }
  if (kind === 'heart') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M12 21s-7.5-4.6-9.5-9.2C1 8.4 3.2 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.8 0 6 3.9 4.5 7.3C19.5 16.4 12 21 12 21z" fill={color} />
      </svg>
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


/** Teman kecil yang duduk di atas gelembung. `wide: true` → hanya tampil di layar ≥ 640 px. */
const RIDERS = [
  { kind: 'kitty', top: '12%', left: '2%', bubble: '#FFC2D6', dur: 7 },
  { kind: 'bunny', top: '30%', left: '90%', bubble: '#A9D4FF', dur: 8 },
  { kind: 'chick', top: '74%', left: '3%', bubble: '#B8DCFF', dur: 6.5 },
  { kind: 'kidBlue', top: '82%', left: '88%', bubble: '#FFC2D6', dur: 7.5 },
  { kind: 'kidPink', top: '50%', left: '6%', bubble: '#A9D4FF', dur: 8.5, wide: true },
  { kind: 'bear', top: '8%', left: '70%', bubble: '#FFE4D4', dur: 7, wide: true },
  { kind: 'cloud', top: '62%', left: '94%', bubble: '#DCEDFF', dur: 9, wide: true },
];

/** Gelembung yang naik terus dari bawah layar (sebagian membawa penumpang mini). */
const RISERS = [
  { left: '8%', size: 18, color: '#FFC2D6', dur: 16, delay: 0 },
  { left: '22%', size: 12, color: '#A9D4FF', dur: 13, delay: 4 },
  { left: '36%', size: 26, color: '#B8DCFF', dur: 19, delay: 8, rider: 'starling' },
  { left: '50%', size: 14, color: '#FFB3CF', dur: 15, delay: 2 },
  { left: '64%', size: 22, color: '#A9D4FF', dur: 18, delay: 11 },
  { left: '78%', size: 26, color: '#FFC2D6', dur: 21, delay: 6, rider: 'bunny' },
  { left: '92%', size: 12, color: '#B8DCFF', dur: 14, delay: 9 },
  { left: '15%', size: 26, color: '#DCEDFF', dur: 22, delay: 13, rider: 'kitty', wide: true },
  { left: '58%', size: 16, color: '#FFE4D4', dur: 17, delay: 15, wide: true },
];

function Bubble({ size, color }) {
  return (
    <span
      className="block rounded-full"
      style={{
        width: size,
        height: size,
        border: '1.5px solid rgb(255 255 255 / 0.9)',
        background: `radial-gradient(circle at 32% 30%, #ffffffdd 0 16%, ${color}aa 55%, ${color}55 100%)`,
      }}
    />
  );
}

/** Mini-chibi duduk di atas gelembung, bergoyang pelan. */
function Rider({ it, i, animated }) {
  const size = 32;
  return (
    <motion.div
      className={`absolute ${it.wide ? 'hidden sm:block' : ''}`}
      style={{ top: it.top, left: it.left }}
      initial={{ scale: 0, opacity: 0 }}
      animate={animated ? { scale: 1, opacity: 0.95, y: [0, -12, 0], rotate: [-6, 6, -6] } : { scale: 1, opacity: 0.6, y: 0, rotate: 0 }}
      transition={{
        scale: { type: 'spring', stiffness: 220, damping: 12, delay: 0.3 + i * 0.1 },
        opacity: { duration: 0.5, delay: 0.3 + i * 0.1 },
        y: animated ? { duration: it.dur / 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 } : { duration: 0.4 },
        rotate: animated ? { duration: it.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 } : { duration: 0.4 },
      }}
    >
      <div className="relative flex flex-col items-center">
        <div className="relative z-10 -mb-3">
          <MiniChibi kind={it.kind} size={size} blink={animated} delay={i * 0.7} />
        </div>
        <Bubble size={size + 14} color={it.bubble} />
      </div>
    </motion.div>
  );
}

/** Gelembung naik dari bawah ke atas lalu muncul lagi. */
function Riser({ it }) {
  return (
    <motion.div
      className={`absolute bottom-0 ${it.wide ? 'hidden sm:block' : ''}`}
      style={{ left: it.left }}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: ['10vh', '-110vh'], x: [0, 14, -10, 8, 0], opacity: [0, 0.85, 0.85, 0] }}
      transition={{
        duration: it.dur,
        delay: it.delay,
        repeat: Infinity,
        ease: 'linear',
        x: { duration: it.dur, delay: it.delay, repeat: Infinity, ease: 'easeInOut' },
        opacity: { duration: it.dur, delay: it.delay, repeat: Infinity, times: [0, 0.1, 0.85, 1] },
      }}
    >
      <div className="flex flex-col items-center">
        {it.rider && (
          <div className="relative z-10 -mb-2.5">
            <MiniChibi kind={it.rider} size={it.size} />
          </div>
        )}
        <Bubble size={it.rider ? it.size + 10 : it.size} color={it.color} />
      </div>
    </motion.div>
  );
}

/**
 * Hiasan pastel di latar belakang: gelembung, bintang, mini-Venn, dan teman-teman kecil
 * yang menumpang gelembung. Tidak menangkap klik, disembunyikan dari pembaca layar,
 * dan berada di belakang konten agar tidak mengganggu keterbacaan.
 * @param {{animated?: boolean}} props  false → hiasan diam, tanpa gelembung naik (layar tugas).
 */
export default function CuteBackdrop({ animated = true }) {
  const faint = (kind) => kind === 'bubble' || kind === 'venn';
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {ITEMS.map((it, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: it.top, left: it.left }}
          initial={{ scale: 0, opacity: 0 }}
          animate={
            animated
              ? {
                  scale: 1,
                  opacity: faint(it.kind) ? 0.45 : 0.7,
                  y: [0, -14, 0],
                  rotate: it.kind === 'bubble' ? 0 : it.kind === 'venn' ? [0, -8, 0] : [0, 18, 0],
                  x: it.kind === 'heart' ? [0, 6, 0] : 0,
                }
              : { scale: 1, opacity: faint(it.kind) ? 0.35 : 0.5, y: 0, rotate: 0, x: 0 }
          }
          transition={{
            scale: { type: 'spring', stiffness: 200, damping: 14, delay: 0.1 + i * 0.06 },
            opacity: { duration: 0.6, delay: 0.1 + i * 0.06 },
            y: animated ? { duration: it.dur / 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 },
            rotate: animated ? { duration: it.dur, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 },
            x: animated ? { duration: it.dur * 0.7, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 },
          }}
        >
          <Shape {...it} />
        </motion.div>
      ))}
      {RIDERS.map((it, i) => (
        <Rider key={it.kind} it={it} i={i} animated={animated} />
      ))}
      {animated && RISERS.map((it, i) => <Riser key={i} it={it} />)}
    </div>
  );
}
