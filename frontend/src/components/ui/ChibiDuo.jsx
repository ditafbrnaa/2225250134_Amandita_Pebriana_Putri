import { motion, AnimatePresence } from 'motion/react';
import { ChibiGirl, ChibiBoy } from './Chibi.jsx';

/**
 * Pinka & Minto + balon dialog komik.
 * @param {{
 *   message: string,
 *   speaker?: 'girl'|'boy',
 *   mood?: import('./Chibi.jsx').ChibiMood,
 *   float?: boolean,      // melayang terus (hanya layar non-tugas, mis. Beranda)
 *   size?: number,
 *   className?: string,
 * }} props
 */
export default function ChibiDuo({ message, speaker = 'girl', mood = 'happy', float = false, size = 84, className = '' }) {
  // Yang berbicara ikut berekspresi; pasangannya tersenyum.
  const girlMood = speaker === 'girl' ? mood : 'happy';
  const boyMood = speaker === 'boy' ? mood : 'happy';
  // Ganti pesan → karakter membal sekali (bukan animasi tanpa henti).
  const bounceKey = float ? undefined : message;

  return (
    <div className={`flex flex-col items-start gap-3 sm:flex-row sm:items-center ${className}`}>
      <div className="flex shrink-0 items-end -space-x-5">
        <ChibiGirl mood={girlMood} size={size} float={float} bounceKey={bounceKey} />
        <ChibiBoy mood={boyMood} size={size * 0.96} float={float} bounceKey={bounceKey} delay={0.35} />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0, scale: 0.8, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          className="speech-bubble order-first max-w-xs sm:order-none"
          data-tail="auto"
          aria-live="polite"
        >
          <span className="mr-1 font-semibold text-brand-dark">{speaker === 'girl' ? 'Pinka:' : 'Minto:'}</span>
          {message}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
