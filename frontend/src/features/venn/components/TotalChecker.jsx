import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FLOW_ORDER, REGION_COLORS } from '../lib/regions.js';

const toNum = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

/**
 * Cek Total Semesta (strategi siswa GL02): Σ isi semua daerah harus sama dengan n(S).
 * @param {{counts:Record<number,any>, total:number, onPulse?:(mask:number|null)=>void, compact?:boolean}} props
 */
export default function TotalChecker({ counts, total, onPulse, compact = false }) {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState(null);
  const timers = useRef([]);

  const values = FLOW_ORDER.map((m) => ({ mask: m, value: toNum(counts?.[m]) }));
  const filled = values.filter((v) => v.value !== null);
  const sum = filled.reduce((s, v) => s + v.value, 0);
  const runningSum = values.slice(0, step + 1).reduce((s, v) => s + (v.value ?? 0), 0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => setResult(null), [JSON.stringify(counts)]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = () => {
    timers.current.forEach(clearTimeout);
    setRunning(true);
    setResult(null);
    setStep(-1);
    values.forEach((v, i) => {
      timers.current.push(
        setTimeout(() => {
          setStep(i);
          onPulse?.(v.mask);
        }, i * 550),
      );
    });
    timers.current.push(
      setTimeout(() => {
        setRunning(false);
        onPulse?.(null);
        const missing = values.filter((v) => v.value === null).length;
        if (missing) setResult({ ok: false, msg: `Masih ada ${missing} daerah yang belum diisi. Daerah kosong tetap harus diisi (boleh 0).` });
        else if (sum === total) setResult({ ok: true, msg: `Pas! ${sum} = n(S) = ${total}. Semua anggota semesta sudah terhitung tepat satu kali.` });
        else
          setResult({
            ok: false,
            msg: `Jumlahnya ${sum}, padahal n(S) = ${total} (selisih ${Math.abs(total - sum)}). ${
              sum > total ? 'Ada anggota yang terhitung dua kali? Periksa irisan.' : 'Ada anggota yang belum terhitung? Periksa daerah di luar lingkaran.'
            }`,
          });
      }, values.length * 550 + 150),
    );
  };

  return (
    <div className={`rounded-2xl bg-white shadow-card ${compact ? 'p-2' : 'p-3'}`}>
      <div className="flex flex-wrap items-center gap-1.5 font-math text-lg" aria-label="Penjumlahan semua daerah">
        {values.map((v, i) => (
          <span key={v.mask} className="flex items-center gap-1.5">
            <motion.span
              animate={step === i ? { scale: [1, 1.25, 1], y: [0, -4, 0] } : { scale: 1 }}
              transition={{ duration: 0.45 }}
              className="inline-grid min-w-9 place-items-center rounded-lg px-1.5 py-0.5 font-bold text-white"
              style={{ background: REGION_COLORS[v.mask] }}
            >
              {v.value ?? '?'}
            </motion.span>
            {i < values.length - 1 && <span className="text-ink/60">+</span>}
          </span>
        ))}
        <span className="text-ink/60">=</span>
        <motion.span key={running ? runningSum : sum} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="font-bold text-ink">
          {running ? runningSum : sum}
        </motion.span>
        <span className="ml-1 text-sm text-ink/60">vs n(S) = {total}</span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button type="button" className="btn btn-secondary" onClick={run} disabled={running}>
          {running ? 'Menghitung…' : 'Cek Total'}
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10" aria-hidden>
          <motion.div
            className={`h-full ${sum === total ? 'bg-emerald-500' : sum > total ? 'bg-red-500' : 'bg-amber-400'}`}
            animate={{ width: `${Math.min(100, (sum / Math.max(total, 1)) * 100)}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 26 }}
          />
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            role="status"
            className={`mt-2 rounded-xl px-3 py-2 text-sm ${result.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}
          >
            {result.ok ? '✔ ' : '🤔 '}
            {result.msg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
