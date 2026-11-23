import { motion, AnimatePresence } from 'motion/react';
import { HINT_LEVEL_NAMES } from '@/features/learn/lib/rmt.js';

/**
 * Bantuan bertingkat (ZPD): pemantik → strategi → langkah. Dibuka satu per satu atas permintaan siswa.
 * Jumlah tingkat dan syarat membukanya diatur oleh lib/rmt.js (makin sedikit di modul akhir).
 * Komponen ini hanya dipakai di modul belajar, TIDAK PERNAH di mode ujian.
 * @param {{ hints:string[], revealed:number, unlocked:boolean, onReveal:(level:number)=>void }} props
 */
export default function HintLadder({ hints, revealed, unlocked, onReveal }) {
  if (!hints.length) return null;
  const shown = hints.slice(0, revealed);
  const more = revealed < hints.length;

  return (
    <div className="card space-y-2" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold">🧭 Bantuan Kak Venn</p>
        <span className="text-xs text-ink/60">
          {revealed}/{hints.length} dibuka
        </span>
      </div>
      <AnimatePresence initial={false}>
        {shown.map((h, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border-2 border-line bg-butter px-3 py-2 text-sm text-amber-950"
          >
            <b>{HINT_LEVEL_NAMES[i] ?? `Petunjuk ${i + 1}`}:</b> {h}
          </motion.p>
        ))}
      </AnimatePresence>
      {more &&
        (unlocked ? (
          <button type="button" className="btn btn-secondary w-full" onClick={() => onReveal(revealed + 1)}>
            {revealed === 0 ? 'Aku butuh bantuan' : 'Masih bingung, bantu lagi'} ({HINT_LEVEL_NAMES[revealed] ?? 'petunjuk'})
          </button>
        ) : (
          <p className="text-sm text-ink/70">Coba dulu sendiri, ya. Bantuan terbuka setelah kamu mencoba sekali.</p>
        ))}
      {!more && <p className="text-xs text-ink/60">Semua bantuan sudah dibuka. Sekarang giliranmu menyelesaikannya.</p>}
    </div>
  );
}
