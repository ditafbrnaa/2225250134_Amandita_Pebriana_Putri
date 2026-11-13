import { motion } from 'motion/react';

/**
 * Karakter mini (figuran) untuk hiasan latar. Pinka & Minto tetap tokoh utama;
 * mini-chibi ini hanya "teman kecil" yang duduk di atas gelembung.
 * SVG buatan sendiri, dekoratif → aria-hidden.
 *
 * @typedef {'kitty'|'bunny'|'chick'|'kidPink'|'kidBlue'|'starling'|'cloud'|'bear'} MiniKind
 */

const INK = '#5A3550';
const BLUSH = '#FF9EC4';

/** Wajah mini: mata berkilau yang bisa berkedip, pipi merona, senyum kecil. */
function MiniFace({ cx = 20, cy = 24, blink = true, delay = 0, mouth = 'smile' }) {
  return (
    <g>
      {[-5, 5].map((dx) => (
        <motion.g
          key={dx}
          style={{ originX: `${cx + dx}px`, originY: `${cy}px` }}
          animate={blink ? { scaleY: [1, 1, 0.1, 1] } : undefined}
          transition={blink ? { duration: 4, times: [0, 0.9, 0.95, 1], repeat: Infinity, delay } : undefined}
        >
          <ellipse cx={cx + dx} cy={cy} rx="2.4" ry="3" fill={INK} />
          <circle cx={cx + dx - 0.8} cy={cy - 1.1} r="0.95" fill="#fff" />
        </motion.g>
      ))}
      <ellipse cx={cx - 8.5} cy={cy + 4} rx="2.4" ry="1.4" fill={BLUSH} opacity="0.75" />
      <ellipse cx={cx + 8.5} cy={cy + 4} rx="2.4" ry="1.4" fill={BLUSH} opacity="0.75" />
      {mouth === 'smile' && <path d={`M${cx - 1.8} ${cy + 3.6}q1.8 1.8 3.6 0`} stroke={INK} strokeWidth="1.1" strokeLinecap="round" fill="none" />}
      {mouth === 'cat' && <path d={`M${cx - 2.4} ${cy + 3.4}q1.2 1.4 2.4 0q1.2 1.4 2.4 0`} stroke={INK} strokeWidth="1.1" strokeLinecap="round" fill="none" />}
      {mouth === 'beak' && <path d={`M${cx - 2} ${cy + 3}l2 2.4 2-2.4z`} fill="#FFB347" stroke="#E08A2E" strokeWidth="0.8" strokeLinejoin="round" />}
      {mouth === 'o' && <ellipse cx={cx} cy={cy + 4.4} rx="1.3" ry="1.6" fill="#FF6F9F" />}
    </g>
  );
}

function Body({ kind, delay, blink }) {
  switch (kind) {
    case 'kitty':
      return (
        <g>
          <path d="M8 14l1-9 8 6M32 14l-1-9-8 6" fill="#fff" stroke="#EB93B9" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M10 10l1-3 3 2.4M30 10l-1-3-3 2.4" fill="#FFC2D6" />
          <ellipse cx="20" cy="24" rx="15" ry="13" fill="#fff" stroke="#EB93B9" strokeWidth="1.6" />
          <path d="M5 25h-4M5 28l-4 1.4M35 25h4M35 28l4 1.4" stroke="#EB93B9" strokeWidth="0.9" strokeLinecap="round" />
          <MiniFace blink={blink} delay={delay} mouth="cat" />
          <path d="M27 11l2.6-1.6.4 3z" fill="#A9D4FF" stroke="#7FB4E6" strokeWidth="0.8" />
        </g>
      );
    case 'bunny':
      return (
        <g>
          <ellipse cx="13" cy="7" rx="3.6" ry="9" fill="#DCEDFF" stroke="#7FB4E6" strokeWidth="1.5" transform="rotate(-10 13 7)" />
          <ellipse cx="27" cy="7" rx="3.6" ry="9" fill="#DCEDFF" stroke="#7FB4E6" strokeWidth="1.5" transform="rotate(10 27 7)" />
          <ellipse cx="13" cy="8" rx="1.6" ry="5.5" fill="#FFC2D6" transform="rotate(-10 13 8)" />
          <ellipse cx="27" cy="8" rx="1.6" ry="5.5" fill="#FFC2D6" transform="rotate(10 27 8)" />
          <ellipse cx="20" cy="25" rx="14.5" ry="12.5" fill="#DCEDFF" stroke="#7FB4E6" strokeWidth="1.6" />
          <MiniFace blink={blink} delay={delay} mouth="o" />
        </g>
      );
    case 'chick':
      return (
        <g>
          <path d="M18 9q2-6 4 0q1-4 3-1" stroke="#E0A93A" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <ellipse cx="20" cy="24" rx="14" ry="13.5" fill="#FFF1C9" stroke="#E0B85A" strokeWidth="1.6" />
          <path d="M6 26q-4-1-3-5M34 26q4-1 3-5" stroke="#E0B85A" strokeWidth="1.4" fill="#FFF1C9" strokeLinecap="round" />
          <MiniFace blink={blink} delay={delay} mouth="beak" />
        </g>
      );
    case 'kidPink':
      return (
        <g>
          <circle cx="20" cy="24" r="13" fill="#FFE9DE" stroke="#F2B7C6" strokeWidth="1.4" />
          <path d="M6 25q-1-17 14-17t14 17q-3-8-9-9q-4 4-12 3q-4 2-7 6z" fill="#FFB3CF" stroke="#E886AE" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="8" cy="12" r="3.4" fill="#FFB3CF" stroke="#E886AE" strokeWidth="1.2" />
          <circle cx="32" cy="12" r="3.4" fill="#FFB3CF" stroke="#E886AE" strokeWidth="1.2" />
          <path d="M28 8l3-2v4z M28 8l-3-2v4z" fill="#A9D4FF" stroke="#7FB4E6" strokeWidth="0.8" />
          <MiniFace blink={blink} cy={25} delay={delay} />
        </g>
      );
    case 'kidBlue':
      return (
        <g>
          <circle cx="20" cy="24" r="13" fill="#FFE9DE" stroke="#F2B7C6" strokeWidth="1.4" />
          {/* kupluk biru dengan pompom pink */}
          <path d="M6 21q0-14 14-14t14 14z" fill="#A9D4FF" stroke="#7FB4E6" strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="5" y="18.5" width="30" height="4.5" rx="2.2" fill="#DCEDFF" stroke="#7FB4E6" strokeWidth="1.2" />
          <circle cx="20" cy="6" r="3.2" fill="#FFB3CF" stroke="#EB93B9" strokeWidth="1.1" />
          <MiniFace blink={blink} cy={27} delay={delay} />
        </g>
      );
    case 'starling':
      return (
        <g>
          <path
            d="M20 3l5 10.5 11.5 1.6-8.3 8 2 11.4L20 29l-10.2 5.5 2-11.4-8.3-8L15 13.5z"
            fill="#FFE27A"
            stroke="#E0B85A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <MiniFace blink={blink} cy={20} delay={delay} />
        </g>
      );
    case 'cloud':
      return (
        <g>
          <path
            d="M9 33q-7 0-7-7t7-7q1-9 11-9t11 8q7 0 7 7.5T31 33z"
            fill="#fff"
            stroke="#A6CDF2"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <MiniFace blink={blink} cy={24} delay={delay} />
        </g>
      );
    case 'bear':
    default:
      return (
        <g>
          <circle cx="9" cy="12" r="5" fill="#FFD6C2" stroke="#E8A98C" strokeWidth="1.4" />
          <circle cx="31" cy="12" r="5" fill="#FFD6C2" stroke="#E8A98C" strokeWidth="1.4" />
          <circle cx="9" cy="12" r="2.2" fill="#FFB3CF" />
          <circle cx="31" cy="12" r="2.2" fill="#FFB3CF" />
          <ellipse cx="20" cy="24" rx="14" ry="13" fill="#FFD6C2" stroke="#E8A98C" strokeWidth="1.6" />
          <ellipse cx="20" cy="29" rx="5" ry="3.4" fill="#FFF3EC" />
          <MiniFace blink={blink} delay={delay} />
        </g>
      );
  }
}

/**
 * @param {{ kind: MiniKind, size?: number, blink?: boolean, delay?: number }} props
 */
export default function MiniChibi({ kind, size = 34, blink = true, delay = 0 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden className="overflow-visible">
      <Body kind={kind} delay={delay} blink={blink} />
    </svg>
  );
}
