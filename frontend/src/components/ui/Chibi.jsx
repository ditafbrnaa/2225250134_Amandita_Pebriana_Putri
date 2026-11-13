import { motion } from 'motion/react';

/**
 * Karakter chibi VennBuster (SVG buatan sendiri, tanpa aset luar).
 *  - "Pinka": cewek, rambut kuncir dua stroberi, pita pink, dress pastel pink.
 *  - "Minto": cowok, rambut cokelat berantakan + ahoge, jepit bintang, hoodie mint dengan tali pink.
 * Dekoratif → aria-hidden. Makna selalu disampaikan lewat teks (balon dialog / pesan).
 */

const SKIN = '#FFE9DE';
const SKIN_LINE = '#F2B7C6';
const LINE = '#C9739B'; // garis lembut (bukan hitam)
const BLUSH = '#FF9EC4';

/** Mata besar berkilau + mulut, sesuai suasana hati. */
function Face({ mood, iris }) {
  const closed = mood === 'cheer' || mood === 'sleepy';
  const look = mood === 'think' ? 3 : 0;
  const big = mood === 'wow' ? 1.15 : 1;

  return (
    <g>
      {/* Mata */}
      {closed ? (
        <g stroke="#5A3550" strokeWidth="3.2" strokeLinecap="round" fill="none">
          {mood === 'cheer' ? (
            <>
              <path d="M37 72q8-9 16 0" />
              <path d="M67 72q8-9 16 0" />
            </>
          ) : (
            <>
              <path d="M37 71q8 6 16 0" />
              <path d="M67 71q8 6 16 0" />
            </>
          )}
        </g>
      ) : (
        [45, 75].map((cx) => (
          <g key={cx} transform={`translate(${cx} 71) scale(${big})`}>
            <ellipse rx="8.5" ry="10.5" fill="#5A3550" />
            <ellipse cx={look} cy="1.5" rx="6.6" ry="8.4" fill={iris} />
            <ellipse cx={look} cy="4" rx="5.2" ry="4.6" fill="#ffffff" opacity="0.25" />
            <circle cx={look - 3} cy="-4" r="3.2" fill="#fff" />
            <circle cx={look + 3} cy="4" r="1.6" fill="#fff" />
            {mood === 'wow' && <path d="M0-1.2l1 2.2 2.4.3-1.8 1.6.5 2.4L0 4.1l-2.1 1.2.5-2.4-1.8-1.6 2.4-.3z" fill="#FFF3A6" />}
            {/* bulu mata */}
            <path d="M-8-8q-2-3 0-5M8-8q2-3 0-5" stroke="#5A3550" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </g>
        ))
      )}

      {/* Pipi merona */}
      <ellipse cx="34" cy="85" rx="7" ry="4" fill={BLUSH} opacity="0.65" />
      <ellipse cx="86" cy="85" rx="7" ry="4" fill={BLUSH} opacity="0.65" />
      <g stroke={BLUSH} strokeWidth="1.4" strokeLinecap="round" opacity="0.9">
        <path d="M31 84l2-2M35 84l2-2M83 84l2-2M87 84l2-2" />
      </g>

      {/* Mulut */}
      {mood === 'happy' && <path d="M54 86q6 6 12 0" stroke="#5A3550" strokeWidth="2.6" strokeLinecap="round" fill="none" />}
      {mood === 'cheer' && <path d="M52 84q8 12 16 0z" fill="#FF6F9F" stroke="#5A3550" strokeWidth="2.4" strokeLinejoin="round" />}
      {mood === 'wow' && <ellipse cx="60" cy="88" rx="4" ry="4.8" fill="#FF6F9F" stroke="#5A3550" strokeWidth="2.2" />}
      {mood === 'think' && <path d="M55 88q3-2.5 5 0t5 0" stroke="#5A3550" strokeWidth="2.4" strokeLinecap="round" fill="none" />}
      {mood === 'sleepy' && <ellipse cx="60" cy="88" rx="2.6" ry="2" fill="#5A3550" />}

      {/* Ekstra ekspresi */}
      {mood === 'think' && <path d="M96 52q4 6 0 9q-4-3 0-9z" fill="#A9DDFF" stroke="#6FB4E6" strokeWidth="1.2" />}
      {mood === 'sleepy' && (
        <text x="96" y="40" fontSize="14" fontWeight="700" fill="#B48FD8" fontFamily="inherit">
          z
        </text>
      )}
    </g>
  );
}

function Floaty({ float, bounceKey, size, children, delay = 0, label }) {
  return (
    <motion.svg
      key={bounceKey}
      viewBox="0 0 120 160"
      width={size}
      height={(size * 160) / 120}
      aria-hidden
      data-chibi={label}
      className="shrink-0 overflow-visible"
      initial={{ y: 10, scale: 0.85, opacity: 0 }}
      animate={float ? { opacity: 1, scale: 1, y: [0, -8, 0], rotate: [-2, 2, -2] } : { opacity: 1, scale: 1, y: 0 }}
      transition={
        float
          ? {
              opacity: { duration: 0.3, delay },
              scale: { type: 'spring', stiffness: 300, damping: 12, delay },
              y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay },
              rotate: { duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay },
            }
          : { type: 'spring', stiffness: 380, damping: 11, delay }
      }
    >
      {children}
    </motion.svg>
  );
}

/**
 * @typedef {'happy'|'cheer'|'wow'|'think'|'sleepy'} ChibiMood
 * @param {{mood?: ChibiMood, size?: number, float?: boolean, bounceKey?: any, delay?: number}} props
 *   float: melayang terus (hanya untuk layar non-tugas).  bounceKey: ganti nilai → membal sekali.
 */
export function ChibiGirl({ mood = 'happy', size = 96, float = false, bounceKey, delay = 0 }) {
  const HAIR = '#F7A9C6';
  const HAIR_DARK = '#E886AE';
  return (
    <Floaty float={float} bounceKey={bounceKey} size={size} delay={delay} label="pinka">
      {/* bayangan */}
      <ellipse cx="60" cy="155" rx="28" ry="4" fill="#E886AE" opacity="0.25" />
      {/* kuncir dua */}
      <ellipse cx="14" cy="88" rx="13" ry="30" fill={HAIR} stroke={HAIR_DARK} strokeWidth="2.5" transform="rotate(14 14 88)" />
      <ellipse cx="106" cy="88" rx="13" ry="30" fill={HAIR} stroke={HAIR_DARK} strokeWidth="2.5" transform="rotate(-14 106 88)" />
      {/* badan: dress pink */}
      <path d="M42 108h36l14 38q-32 9-64 0z" fill="#FFB8D4" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M33 140q27 8 54 0" stroke="#fff" strokeWidth="3" strokeDasharray="1 6" strokeLinecap="round" fill="none" />
      <path d="M48 108l12 9 12-9" fill="#fff" stroke={LINE} strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="60" cy="118" r="3.2" fill="#FF6FAE" />
      {/* tangan & kaki */}
      <circle cx="35" cy="126" r="6.5" fill={SKIN} stroke={SKIN_LINE} strokeWidth="2" />
      <circle cx="85" cy="126" r="6.5" fill={SKIN} stroke={SKIN_LINE} strokeWidth="2" />
      <rect x="47" y="144" width="10" height="11" rx="5" fill="#fff" stroke={LINE} strokeWidth="2" />
      <rect x="63" y="144" width="10" height="11" rx="5" fill="#fff" stroke={LINE} strokeWidth="2" />
      {/* rambut belakang */}
      <circle cx="60" cy="62" r="46" fill={HAIR} stroke={HAIR_DARK} strokeWidth="2.5" />
      {/* wajah */}
      <ellipse cx="60" cy="72" rx="38" ry="35" fill={SKIN} stroke={SKIN_LINE} strokeWidth="2" />
      {/* poni */}
      <path
        d="M20 66Q20 22 60 20t40 46q-8-14-18-16-6 10-22 4-4 8-16 4-12 6-24 8z"
        fill={HAIR}
        stroke={HAIR_DARK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M38 30q10-6 22-6" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
      {/* pita */}
      <g transform="translate(84 24) rotate(18)">
        <path d="M0 0l-16-11v22zM0 0l16-11v22z" fill="#FF6FAE" stroke={LINE} strokeWidth="2.2" strokeLinejoin="round" />
        <circle r="4.5" fill="#FF8FBF" stroke={LINE} strokeWidth="2" />
      </g>
      <Face mood={mood} iris="#B26BC9" />
    </Floaty>
  );
}

/** @param {{mood?: ChibiMood, size?: number, float?: boolean, bounceKey?: any, delay?: number}} props */
export function ChibiBoy({ mood = 'happy', size = 96, float = false, bounceKey, delay = 0 }) {
  const HAIR = '#9C6F5E';
  const HAIR_DARK = '#7D5446';
  return (
    <Floaty float={float} bounceKey={bounceKey} size={size} delay={delay} label="minto">
      <ellipse cx="60" cy="155" rx="28" ry="4" fill="#E886AE" opacity="0.25" />
      {/* badan: hoodie mint */}
      <path d="M40 106h40l10 40q-30 8-60 0z" fill="#BDEFD9" stroke="#6CC39C" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M44 106q16 14 32 0" fill="#A6E6CA" stroke="#6CC39C" strokeWidth="2.2" />
      <path d="M54 114v12M66 114v12" stroke="#FF8FBF" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="54" cy="127" r="2.4" fill="#FF8FBF" />
      <circle cx="66" cy="127" r="2.4" fill="#FF8FBF" />
      <rect x="47" y="132" width="26" height="8" rx="4" fill="#A6E6CA" stroke="#6CC39C" strokeWidth="1.8" />
      {/* tangan & kaki */}
      <circle cx="34" cy="126" r="6.5" fill={SKIN} stroke={SKIN_LINE} strokeWidth="2" />
      <circle cx="86" cy="126" r="6.5" fill={SKIN} stroke={SKIN_LINE} strokeWidth="2" />
      <rect x="47" y="144" width="10" height="11" rx="5" fill="#FFC2D6" stroke={LINE} strokeWidth="2" />
      <rect x="63" y="144" width="10" height="11" rx="5" fill="#FFC2D6" stroke={LINE} strokeWidth="2" />
      {/* rambut belakang */}
      <circle cx="60" cy="62" r="45" fill={HAIR} stroke={HAIR_DARK} strokeWidth="2.5" />
      {/* wajah */}
      <ellipse cx="60" cy="72" rx="38" ry="35" fill={SKIN} stroke={SKIN_LINE} strokeWidth="2" />
      {/* poni runcing */}
      <path
        d="M18 64Q16 22 60 18t42 46l-8-14-6 10-6-14-8 12-10-16-10 16-8-12-6 14-6-10z"
        fill={HAIR}
        stroke={HAIR_DARK}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* ahoge */}
      <path d="M58 20q2-16 16-16-10 5-10 16" fill={HAIR} stroke={HAIR_DARK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M36 32q10-8 22-9" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* jepit bintang */}
      <path
        d="M92 40l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"
        fill="#FFE07A"
        stroke="#E8B53E"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Face mood={mood} iris="#5C8FD6" />
    </Floaty>
  );
}
