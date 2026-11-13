import { useId, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { twoSetLayout, regionSlots } from '../lib/geometry.js';
import { MASKS, REGION_COLORS, REGION_GLOW, NEUTRAL_FILL, describeRegion } from '../lib/regions.js';
import { regionSpring, flowDelay, bouncyIn, floatIdle, floatTransition } from '../lib/motion.js';
import { useAppStore } from '@/store/useAppStore.js';

const DEFAULT_LAYOUT = twoSetLayout();
const DIM_FILL = '#F6F1FB';
const INK = '#2A2350';
const UNIVERSE_RX = 18;
const MARK_STYLE = {
  correct: { stroke: '#16A34A', dash: undefined },
  missed: { stroke: '#D97706', dash: '6 5' },
  wrong: { stroke: '#DC2626', dash: undefined },
};
const CENTER_ORIGIN = { transformBox: 'fill-box', transformOrigin: 'center' };

/**
 * Diagram Venn interaktif 2 himpunan. Setiap daerah = <motion.path> terpisah.
 *
 * @param {object} props
 * @param {{A?:string,B?:string,S?:string}} [props.labels]  nama himpunan
 * @param {number[]} [props.highlighted]   daerah yang menyala (interactive highlighting)
 * @param {number[]} [props.shaded]        daerah yang diarsir siswa (Mode Arsir)
 * @param {Record<number,'correct'|'missed'|'wrong'>} [props.marks] umpan balik per daerah
 * @param {Record<number, number|string>} [props.counts] angka di tiap daerah
 * @param {Record<number,string>} [props.regionTags] penanda netral daerah (mis. ①) untuk mode ujian
 * @param {{id:string,value:any,mask:number}[]} [props.tokens] anggota yang sudah ditempatkan
 * @param {number|null} [props.pulseMask]  daerah yang berkedip
 * @param {number} [props.pulseKey]        ubah nilainya untuk memicu ulang kedipan
 * @param {boolean} [props.dimOthers]      redupkan daerah lain saat ada yang menyala
 * @param {boolean} [props.interactive]
 * @param {(mask:number)=>void} [props.onRegionClick]
 */
export default function VennCanvas({
  labels = {},
  highlighted = [],
  shaded = [],
  marks = {},
  counts,
  regionTags,
  tokens = [],
  pulseMask = null,
  pulseKey = 0,
  dimOthers = true,
  interactive = true,
  onRegionClick,
  layout = DEFAULT_LAYOUT,
  className = '',
  title = 'Diagram Venn',
}) {
  const uid = useId().replace(/:/g, '');
  // Saat ujian: diagram tetap tenang (tanpa melayang/pendar hover).
  const examActive = useAppStore((s) => s.examActive);
  const [hoverMask, setHoverMask] = useState(null);
  const { universe: u, circles, paths, labelPos, setLabelPos } = layout;
  const anyLit = highlighted.length > 0;
  const nameA = labels.A ?? 'A';
  const nameB = labels.B ?? 'B';
  const playful = !examActive;

  const slots = useMemo(() => Object.fromEntries(MASKS.map((m) => [m, regionSlots(layout, m)])), [layout]);
  const placed = useMemo(() => {
    const perMask = { 0: 0, 1: 0, 2: 0, 3: 0 };
    return tokens
      .filter((t) => t.mask !== null && t.mask !== undefined)
      .map((t) => {
        const slot = slots[t.mask][perMask[t.mask]++] ?? labelPos[t.mask];
        return { ...t, ...slot };
      });
  }, [tokens, slots, labelPos]);

  const handleKey = (e, mask) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRegionClick?.(mask);
    }
  };

  const regionAria = (mask) => {
    const d = describeRegion(mask, { A: nameA, B: nameB });
    const c = counts?.[mask];
    return `Daerah ${regionTags?.[mask] ?? d.name}${c !== undefined && c !== '' ? `, berisi ${c}` : ''}`;
  };

  const glowOpacity = (mask) => {
    if (!playful) return 0;
    if (highlighted.includes(mask)) return 0.75;
    if (interactive && hoverMask === mask) return 0.55;
    return 0;
  };

  const clip = `url(#${uid}-uni)`;

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className={`w-full h-auto select-none touch-manipulation overflow-visible ${className}`}
      role="group"
      aria-label={title}
    >
      <defs>
        {/* Semesta bersudut bulat */}
        <clipPath id={`${uid}-uni`}>
          <rect x={u.x} y={u.y} width={u.w} height={u.h} rx={UNIVERSE_RX} />
        </clipPath>
        {/* Pendar lembut */}
        <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={`${uid}-soft`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#9B6BFF" floodOpacity="0.18" />
        </filter>
        {/* Pola pembeda daerah (agar tidak bergantung pada warna saja) */}
        <pattern id={`${uid}-p1`} width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="1.4" fill={INK} />
        </pattern>
        <pattern id={`${uid}-p2`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="9" stroke={INK} strokeWidth="1.4" />
        </pattern>
        <pattern id={`${uid}-p3`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0V9M0 0H9" stroke={INK} strokeWidth="1.2" />
        </pattern>
        <pattern id={`${uid}-p0`} width="10" height="10" patternUnits="userSpaceOnUse">
          <line x1="0" y1="5" x2="10" y2="5" stroke={INK} strokeWidth="1.2" />
        </pattern>
        {/* Arsiran seperti pensil */}
        <pattern id={`${uid}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
        </pattern>
      </defs>

      {/* Masuk: membesar perlahan + memantul lembut */}
      <motion.g initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={bouncyIn} style={CENTER_ORIGIN}>
        {/* Melayang halus (beberapa siklus saja, lalu diam) */}
        <motion.g animate={playful ? floatIdle : { y: 0 }} transition={playful ? floatTransition : { duration: 0.2 }}>
          {/* Bayangan lembut di bawah semesta */}
          <rect x={u.x} y={u.y} width={u.w} height={u.h} rx={UNIVERSE_RX} fill="#fff" filter={`url(#${uid}-soft)`} pointerEvents="none" />

          {/* 1. Daerah yang dapat diklik */}
          <g clipPath={clip}>
            {MASKS.map((mask) => {
              const lit = highlighted.includes(mask);
              const fill = lit ? REGION_COLORS[mask] : anyLit && dimOthers ? DIM_FILL : NEUTRAL_FILL;
              const canPop = playful && interactive && mask !== 0;
              return (
                <motion.path
                  key={`r-${mask}`}
                  d={paths[mask]}
                  fillRule={mask === 0 ? 'evenodd' : undefined}
                  data-mask={mask}
                  className="venn-region"
                  role={interactive ? 'button' : undefined}
                  tabIndex={interactive ? 0 : -1}
                  aria-pressed={interactive ? lit : undefined}
                  aria-label={regionAria(mask)}
                  initial={false}
                  animate={{ fill, fillOpacity: 1, scale: canPop && lit ? [1, 1.07, 1] : 1 }}
                  whileHover={canPop ? { scale: 1.04 } : undefined}
                  whileTap={canPop ? { scale: 0.97 } : undefined}
                  transition={{
                    ...regionSpring,
                    delay: lit ? flowDelay(mask, highlighted) : 0,
                    scale: { type: 'tween', duration: 0.3, ease: 'easeOut' },
                  }}
                  onClick={interactive ? () => onRegionClick?.(mask) : undefined}
                  onKeyDown={interactive ? (e) => handleKey(e, mask) : undefined}
                  onPointerEnter={interactive ? () => setHoverMask(mask) : undefined}
                  onPointerLeave={interactive ? () => setHoverMask((m) => (m === mask ? null : m)) : undefined}
                  onFocus={interactive ? () => setHoverMask(mask) : undefined}
                  onBlur={interactive ? () => setHoverMask((m) => (m === mask ? null : m)) : undefined}
                  style={{ cursor: interactive ? 'pointer' : 'default', ...CENTER_ORIGIN }}
                />
              );
            })}

            {/* 2. Pola pembeda pada daerah yang menyala */}
            {MASKS.map((mask) => (
              <motion.path
                key={`p-${mask}`}
                d={paths[mask]}
                fillRule={mask === 0 ? 'evenodd' : undefined}
                fill={`url(#${uid}-p${mask})`}
                pointerEvents="none"
                initial={false}
                animate={{ opacity: highlighted.includes(mask) ? 0.16 : 0 }}
                transition={{ duration: 0.25, delay: highlighted.includes(mask) ? flowDelay(mask, highlighted) : 0 }}
              />
            ))}

            {/* 3. Arsiran (efek sapuan dari kiri ke kanan) */}
            <AnimatePresence>
              {shaded.map((mask) => (
                <motion.g key={`s-${mask}`} pointerEvents="none" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
                  <clipPath id={`${uid}-wipe-${mask}`}>
                    <motion.rect x={u.x} y={u.y} height={u.h} initial={{ width: 0 }} animate={{ width: u.w }} transition={{ duration: 0.45, ease: 'easeOut' }} />
                  </clipPath>
                  <path
                    d={paths[mask]}
                    fillRule={mask === 0 ? 'evenodd' : undefined}
                    fill={`url(#${uid}-hatch)`}
                    opacity={0.7}
                    clipPath={`url(#${uid}-wipe-${mask})`}
                  />
                </motion.g>
              ))}
            </AnimatePresence>

            {/* 4. Kedipan (Cek Total / petunjuk) */}
            {pulseMask !== null && pulseMask !== undefined && (
              <motion.path
                key={`pulse-${pulseMask}-${pulseKey}`}
                d={paths[pulseMask]}
                fillRule={pulseMask === 0 ? 'evenodd' : undefined}
                fill="#FFD84D"
                pointerEvents="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.75, 0] }}
                transition={{ duration: 0.55, ease: 'easeInOut' }}
              />
            )}
          </g>

          {/* 4b. Pendar (glow) daerah yang di-hover/menyala */}
          <g pointerEvents="none" fill="none" filter={`url(#${uid}-glow)`}>
            {MASKS.filter((m) => m !== 0).map((mask) => (
              <motion.path
                key={`g-${mask}`}
                d={paths[mask]}
                stroke={REGION_GLOW[mask]}
                strokeWidth="7"
                initial={false}
                animate={{ opacity: glowOpacity(mask) }}
                transition={{ duration: 0.25 }}
              />
            ))}
          </g>

          {/* 5. Garis tepi S, A, B (tidak menangkap klik) */}
          <g pointerEvents="none" fill="none" strokeWidth="2.5">
            <rect x={u.x} y={u.y} width={u.w} height={u.h} rx={UNIVERSE_RX} stroke={INK} strokeOpacity="0.55" />
            <circle cx={circles.A.cx} cy={circles.A.cy} r={circles.A.r} stroke={REGION_GLOW[1]} />
            <circle cx={circles.B.cx} cy={circles.B.cy} r={circles.B.r} stroke={REGION_GLOW[2]} />
          </g>

          {/* 6. Umpan balik per daerah */}
          {MASKS.filter((m) => marks[m]).map((mask) => (
            <motion.path
              key={`m-${mask}-${marks[mask]}`}
              d={paths[mask]}
              fillRule={mask === 0 ? 'evenodd' : undefined}
              fill="none"
              stroke={MARK_STYLE[marks[mask]].stroke}
              strokeDasharray={MARK_STYLE[marks[mask]].dash}
              strokeWidth="4"
              pointerEvents="none"
              clipPath={mask === 0 ? clip : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          ))}

          {/* 7. Label himpunan */}
          <g pointerEvents="none" className="venn-label" fill={INK}>
            <text x={setLabelPos.S.x} y={setLabelPos.S.y} fontWeight="800" fontSize="15">
              {labels.S ?? 'S'}
            </text>
            <text x={setLabelPos.A.x} y={setLabelPos.A.y} textAnchor="middle" fontWeight="800" fontSize="14" fill="#1D4ED8">
              {nameA.length > 16 ? `${nameA.slice(0, 15)}…` : nameA}
            </text>
            <text x={setLabelPos.B.x} y={setLabelPos.B.y} textAnchor="middle" fontWeight="800" fontSize="14" fill="#B45309">
              {nameB.length > 16 ? `${nameB.slice(0, 15)}…` : nameB}
            </text>
          </g>

          {/* 8. Penanda netral daerah & angka */}
          <g pointerEvents="none" textAnchor="middle" fill={INK}>
            {MASKS.map((mask) => {
              const p = labelPos[mask];
              const value = counts?.[mask];
              const hasValue = value !== undefined && value !== null && value !== '';
              return (
                <g key={`l-${mask}`}>
                  {regionTags?.[mask] && (
                    <text x={p.x} y={hasValue ? p.y - 16 : p.y + 6} fontSize="16" fontWeight="700" opacity="0.7">
                      {regionTags[mask]}
                    </text>
                  )}
                  <AnimatePresence mode="popLayout">
                    {hasValue && (
                      <motion.text
                        key={`${mask}-${value}`}
                        x={p.x}
                        y={p.y + 8}
                        fontSize="22"
                        fontWeight="800"
                        className="venn-label"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={bouncyIn}
                        style={CENTER_ORIGIN}
                      >
                        {value}
                      </motion.text>
                    )}
                  </AnimatePresence>
                </g>
              );
            })}
          </g>

          {/* 9. Token anggota yang sudah ditempatkan */}
          <g pointerEvents="none">
            <AnimatePresence>
              {placed.map((t) => (
                <motion.g
                  key={t.id}
                  initial={{ x: labelPos[t.mask].x, y: labelPos[t.mask].y, scale: 0, opacity: 0 }}
                  animate={{ x: t.x, y: t.y, scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={bouncyIn}
                >
                  <circle r="11" fill="#fff" stroke={REGION_GLOW[t.mask]} strokeWidth="2" />
                  <text y="4.5" textAnchor="middle" fontSize="12" fontWeight="800" fill={INK}>
                    {t.value}
                  </text>
                </motion.g>
              ))}
            </AnimatePresence>
          </g>
        </motion.g>
      </motion.g>
    </svg>
  );
}
