import { motion } from 'motion/react';
import { moduleSummary } from '@/features/learn/lib/rmt.js';

/**
 * Mediasi MLE (Feuerstein) di awal dan akhir modul.
 * - Awal: intentionality (tujuan belajar) + mediation of meaning (mengapa penting).
 * - Akhir: transcendence (di mana lagi dipakai) + catatan proses belajar (asesmen formatif).
 * @param {{ kind:'start'|'end', mediation:{goal:string, meaning:string, transcendence:string}, log?:object }} props
 */
export default function MediationCard({ kind, mediation, log }) {
  if (!mediation) return null;

  if (kind === 'start') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card space-y-2 bg-sky-soft">
        <p className="text-sm">
          <b>🎯 Tujuan belajar kita:</b> {mediation.goal}
        </p>
        <p className="text-sm">
          <b>💡 Kenapa ini penting?</b> {mediation.meaning}
        </p>
      </motion.div>
    );
  }

  const s = moduleSummary(log);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card space-y-2 bg-mint">
      <p className="text-sm">
        <b>🌍 Di mana lagi ini dipakai?</b> {mediation.transcendence}
      </p>
      {s.graded > 0 && (
        <div className="rounded-xl border-2 border-line bg-white p-2 text-sm">
          <p className="font-bold">📒 Catatan belajarmu di modul ini</p>
          <ul className="mt-1 space-y-0.5">
            <li>✨ {s.mandiri} tugas kamu selesaikan sendiri</li>
            {s.sedikit > 0 && <li>🤝 {s.sedikit} tugas selesai dengan sedikit bantuan</li>}
            {s.banyak > 0 && <li>🧭 {s.banyak} tugas selesai dengan banyak bantuan</li>}
          </ul>
          <p className="mt-1 text-xs text-ink/70">Bantuan itu wajar. Yang penting, makin lama kamu makin bisa sendiri.</p>
        </div>
      )}
    </motion.div>
  );
}
