import { motion, AnimatePresence } from 'motion/react';
import { matchOperation } from '../lib/expression.js';
import { describeRegion, REGION_NOTATION, REGION_COLORS, FLOW_ORDER } from '../lib/regions.js';

/**
 * Menjelaskan daerah yang sedang menyala: notasi + kalimat sehari-hari + anggota.
 * @param {{selected:number[], labels?:object, members?:Record<number, any[]>, guess?:boolean}} props
 */
export default function NotationChip({ selected, labels = {}, members, guess = true }) {
  const op = selected.length > 1 && guess ? matchOperation(selected) : null;
  const single = selected.length === 1 ? selected[0] : null;
  const key = selected.slice().sort().join('-') || 'none';
  const ordered = FLOW_ORDER.filter((m) => selected.includes(m));
  const allMembers = members ? ordered.flatMap((m) => members[m] ?? []) : null;

  return (
    <div className="min-h-24" aria-live="polite">
      <AnimatePresence mode="wait">
        {selected.length === 0 ? (
          <motion.p
            key="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border-2 border-dashed border-ink/15 p-3 text-sm text-ink/60"
          >
            👆 Ketuk salah satu daerah pada diagram, atau pilih tombol operasi.
          </motion.p>
        ) : (
          <motion.div
            key={key}
            layoutId="notation-chip"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="rounded-2xl bg-white p-3 cartoon"
          >
            <div className="flex flex-wrap items-center gap-2">
              {ordered.map((m) => (
                <span key={m} className="h-3 w-3 rounded-full" style={{ background: REGION_COLORS[m] }} aria-hidden />
              ))}
              <span className="font-math text-xl font-bold text-ink">
                {single !== null ? REGION_NOTATION[single] : op ? op.label : 'Beberapa daerah'}
              </span>
              {op && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-800">{op.word}</span>}
            </div>
            <p className="mt-1 text-sm text-ink/80">
              {single !== null
                ? `Daerah ini berisi ${describeRegion(single, labels).sentence}.`
                : op
                  ? `Kamu memilih ${op.label} (${op.word}). ${op.hint}`
                  : 'Pilihanmu belum cocok dengan satu operasi. Coba tambah atau kurangi daerahnya.'}
            </p>
            {allMembers && (
              <p className="mt-1 text-sm">
                <span className="font-semibold">Anggota: </span>
                <span className="font-math">{allMembers.length ? `{ ${allMembers.join(', ')} }` : '{ } (himpunan kosong)'}</span>
                <span className="text-ink/60"> → {allMembers.length} anggota</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
