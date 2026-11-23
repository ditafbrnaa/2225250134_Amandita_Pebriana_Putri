import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import VennCanvas from './VennCanvas.jsx';
import OperationBar from './OperationBar.jsx';
import NotationChip from './NotationChip.jsx';
import { regionsFor } from '../lib/expression.js';

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/**
 * Venn Lab — Interactive Highlighting.
 * - Mode bebas: ketuk daerah / pilih operasi → warna mengalir ke daerah yang sesuai.
 * - Mode tugas (props.task): siswa memilih daerah sendiri lalu memeriksa (bilah operasi disembunyikan).
 */
/** onOperation?: (opId|null) => void — dipanggil saat siswa memilih operasi (dipakai balon chibi di Lab). */
export default function ExploreActivity({ labels = {}, members, counts, task, onComplete, onMistake, onOperation }) {
  const [selected, setSelected] = useState([]);
  const [activeOp, setActiveOp] = useState(null);
  const [multi, setMulti] = useState(Boolean(task?.multi));
  const [feedback, setFeedback] = useState(null);

  const clickRegion = (mask) => {
    setActiveOp(null);
    setFeedback(null);
    setSelected((s) => {
      if (multi) return s.includes(mask) ? s.filter((m) => m !== mask) : [...s, mask];
      return s.length === 1 && s[0] === mask ? [] : [mask];
    });
  };

  const selectOp = (op) => {
    setActiveOp(op?.id ?? null);
    setSelected(op ? regionsFor(op.id) : []);
    onOperation?.(op?.id ?? null);
  };

  const compare = () => selectOp({ id: activeOp === 'A∩B' ? 'A∪B' : 'A∩B' });

  const check = () => {
    const ok = sameSet(selected, regionsFor(task.expr));
    setFeedback(ok ? 'ok' : 'retry');
    if (ok) onComplete?.();
    else onMistake?.();
  };

  return (
    <div className="space-y-3">
      {task && (
        <p className="rounded-2xl border-2 border-line bg-babyblue px-3 py-2 font-semibold text-violet-950">
          🎯 {task.prompt}
          {task.multi && <span className="block text-xs font-normal text-violet-800">Boleh memilih lebih dari satu daerah.</span>}
        </p>
      )}

      <VennCanvas labels={labels} highlighted={selected} counts={counts} onRegionClick={clickRegion} />

      {!task && (
        <>
          <OperationBar active={activeOp} onSelect={selectOp} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary" onClick={compare}>
              Bandingkan ∩ ⇄ ∪
            </button>
            <label className="btn btn-ghost cursor-pointer">
              <input type="checkbox" className="accent-pink-500" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
              Pilih banyak daerah
            </label>
          </div>
        </>
      )}

      {task && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-primary" onClick={check} disabled={!selected.length || feedback === 'ok'}>
            Periksa
          </button>
          {!task.multi && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-pink-500" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
              Pilih banyak daerah
            </label>
          )}
        </div>
      )}

      <AnimatePresence>
        {feedback && (
          <motion.p
            key={feedback}
            initial={{ opacity: 0 }}
            animate={feedback === 'ok' ? { opacity: 1, scale: [1, 1.05, 1] } : { opacity: 1, x: [0, -6, 6, 0] }}
            exit={{ opacity: 0 }}
            role="status"
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${feedback === 'ok' ? 'border-2 border-line bg-mint text-emerald-900' : 'border-2 border-line bg-butter text-amber-900'}`}
          >
            {feedback === 'ok' ? '✔ Benar! ' + (task.success ?? '') : `Belum tepat. ${task.hint ?? 'Baca lagi kata kuncinya, lalu coba lagi.'}`}
          </motion.p>
        )}
      </AnimatePresence>

      {(!task || feedback === 'ok') && <NotationChip selected={selected} labels={labels} members={members} guess={!task || feedback === 'ok'} />}
    </div>
  );
}
