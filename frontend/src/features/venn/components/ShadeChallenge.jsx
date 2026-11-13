import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import VennCanvas from './VennCanvas.jsx';
import { regionsFor, OPERATIONS } from '../lib/expression.js';
import { MASKS } from '../lib/regions.js';

const wordOf = (expr) => OPERATIONS.find((o) => o.id === expr)?.word;
const pretty = (expr) => expr.replace(/([∪∩−])/g, ' $1 ');

/**
 * Mode Arsir (GL01): siswa mengarsir sendiri daerah sesuai ekspresi, lalu memeriksa.
 * @param {{challenges:string[], labels?:object, onComplete?:()=>void}} props
 */
export default function ShadeChallenge({ challenges, labels, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [shaded, setShaded] = useState([]);
  const [marks, setMarks] = useState({});
  const [status, setStatus] = useState(null); // null | 'ok' | 'retry'
  const expr = challenges[idx];
  const done = idx >= challenges.length;

  const toggle = (mask) => {
    if (status === 'ok') return;
    setMarks({});
    setStatus(null);
    setShaded((s) => (s.includes(mask) ? s.filter((m) => m !== mask) : [...s, mask]));
  };

  const check = () => {
    const target = regionsFor(expr);
    const m = {};
    MASKS.forEach((mask) => {
      const isT = target.includes(mask);
      const isS = shaded.includes(mask);
      if (isT && isS) m[mask] = 'correct';
      else if (isT && !isS) m[mask] = 'missed';
      else if (!isT && isS) m[mask] = 'wrong';
    });
    setMarks(m);
    setStatus(Object.values(m).every((v) => v === 'correct') ? 'ok' : 'retry');
  };

  const next = () => {
    setShaded([]);
    setMarks({});
    setStatus(null);
    const n = idx + 1;
    setIdx(n);
    if (n >= challenges.length) onComplete?.();
  };

  if (done) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl border-2 border-line bg-mint p-4 text-center">
        <p className="text-3xl">🎉</p>
        <p className="font-bold text-emerald-900">Semua tantangan arsir selesai!</p>
        <button type="button" className="btn btn-ghost mt-2" onClick={() => setIdx(0)}>
          Ulangi dari awal
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink/60">
          Tantangan {idx + 1} / {challenges.length}
        </p>
        <div className="flex gap-1" aria-hidden>
          {challenges.map((_, i) => (
            <span key={i} className={`h-2 w-6 rounded-full ${i < idx ? 'border-2 border-line bg-mint0' : i === idx ? 'border-2 border-line bg-babyblue0' : 'bg-ink/10'}`} />
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={expr}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="text-lg font-bold text-ink"
        >
          Arsirlah daerah <span className="rounded-lg bg-violet-100 px-2 font-math text-violet-900">{pretty(expr)}</span>
          {wordOf(expr) && <span className="ml-1 text-sm font-semibold text-ink/60">({wordOf(expr)})</span>}
        </motion.p>
      </AnimatePresence>

      <VennCanvas labels={labels} shaded={shaded} marks={marks} onRegionClick={toggle} title={`Arsir daerah ${expr}`} />

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink/70">
        <span className="flex items-center gap-1"><i className="h-3 w-3 rounded-sm border-2 border-emerald-600" /> tepat</span>
        <span className="flex items-center gap-1"><i className="h-3 w-3 rounded-sm border-2 border-dashed border-amber-600" /> terlewat</span>
        <span className="flex items-center gap-1"><i className="h-3 w-3 rounded-sm border-2 border-red-600" /> tidak termasuk</span>
      </div>

      <AnimatePresence>
        {status && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={status === 'ok' ? { opacity: 1, y: 0, scale: [1, 1.05, 1] } : { opacity: 1, y: 0, x: [0, -6, 6, 0] }}
            exit={{ opacity: 0 }}
            role="status"
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${status === 'ok' ? 'border-2 border-line bg-mint text-emerald-900' : 'border-2 border-line bg-butter text-amber-900'}`}
          >
            {status === 'ok' ? '✔ Tepat sekali! Arsiranmu sudah benar.' : 'Belum tepat. Lihat garis berwarna: daerah putus-putus terlewat, garis merah tidak termasuk.'}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        {status === 'ok' ? (
          <button type="button" className="btn btn-primary" onClick={next}>
            Lanjut →
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={check} disabled={!shaded.length}>
            Periksa
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => { setShaded([]); setMarks({}); setStatus(null); }}>
          Hapus arsiran
        </button>
      </div>
    </div>
  );
}
