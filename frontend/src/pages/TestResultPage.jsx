import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppStore } from '@/store/useAppStore.js';
import { api, backendEnabled, flushQueue } from '@/services/api.js';
import { nGain } from '@/features/assessment/lib/scoring.js';

function ScoreBar({ label, value, max, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-ink/10">
        <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

const scoreOf = (r) => (r ? r.total ?? r.autoTotal : null);

export default function TestResultPage() {
  const { type } = useParams();
  const attempts = useAppStore((s) => s.attempts);
  const setAttemptResult = useAppStore((s) => s.setAttemptResult);
  const pending = useAppStore((s) => s.syncQueue.length);
  const [loading, setLoading] = useState(false);
  const attempt = attempts[type];

  if (!attempt || attempt.status !== 'submitted') return <Navigate to="/" replace />;
  const r = attempt.result;

  const refresh = async () => {
    setLoading(true);
    await flushQueue();
    try {
      setAttemptResult(type, { ...(await api.getAttempt(attempt.id)), source: 'server' });
    } catch {
      /* masih offline */
    }
    setLoading(false);
  };

  // Pretest: skor tidak ditampilkan agar tidak memengaruhi posttest (butir sama).
  if (type === 'pre') {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-6xl">
          📝
        </motion.p>
        <h1 className="text-2xl font-extrabold">Pretest selesai. Terima kasih!</h1>
        <p className="text-ink/70">Jawabanmu sudah tersimpan. Sekarang modul belajar sudah terbuka. Selamat menjelajah!</p>
        {backendEnabled && pending > 0 && <p className="text-sm text-amber-800">⏳ Jawaban akan terkirim otomatis saat ada internet.</p>}
        <Link to="/" className="btn btn-primary">
          Ke Peta Belajar →
        </Link>
      </div>
    );
  }

  const pre = attempts.pre?.result;
  const postScore = scoreOf(r);
  const preScore = scoreOf(pre);
  const max = r?.max ?? 24;
  const g = postScore !== null && preScore !== null ? nGain(preScore, postScore, max) : null;
  const provisional = (r?.pendingCount ?? 0) > 0 || (pre?.pendingCount ?? 0) > 0;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="text-center">
        <motion.p initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }} className="text-6xl">
          🏆
        </motion.p>
        <h1 className="text-2xl font-extrabold">Posttest selesai!</h1>
      </div>

      {!r ? (
        <div className="card space-y-2 text-center">
          <p>Jawabanmu sudah tersimpan. Hasil akan muncul setelah terkirim ke server.</p>
          {backendEnabled && (
            <button type="button" className="btn btn-secondary" onClick={refresh} disabled={loading}>
              {loading ? 'Memuat…' : 'Muat hasil'}
            </button>
          )}
        </div>
      ) : (
        <div className="card space-y-3">
          {preScore !== null && <ScoreBar label="Pretest" value={preScore} max={max} color="bg-slate-400" />}
          <ScoreBar label="Posttest" value={postScore} max={max} color="bg-violet-600" />
          {g && (
            <p className="rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-950">
              Peningkatan (N-gain): <b>{g.value.toFixed(2)}</b>, kategori <b>{g.category}</b>
            </p>
          )}
          {provisional && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Skor ini <b>sementara</b>. Langkah yang berisi alasan/kesimpulan akan dinilai oleh guru.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {r.items.map((it) => (
              <div key={it.no} className="rounded-xl bg-ink/5 p-2 text-center">
                <p className="font-bold">Soal {it.no}</p>
                <p className="text-lg font-extrabold">
                  {it.total ?? it.auto}/{it.max}
                </p>
                {it.pending > 0 && <p className="text-xs text-amber-800">{it.pending} menunggu guru</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link to="/" className="btn btn-primary w-full">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
